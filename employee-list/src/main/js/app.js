const React = require('react');
const ReactDOM = require('react-dom');
const client = require('./client');
const follow = require('./follow'); // function to hop multiple links by "rel"
const when = require('when');
const stompClient = require('./websocket-listener')
const root = '/api';

class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {employees: [], attributes: [], page: 1, pageSize: 4, links: {}};
        this.updatePageSize = this.updatePageSize.bind(this);
        this.onCreate = this.onCreate.bind(this);
        this.onDelete = this.onDelete.bind(this);
        this.onNavigate = this.onNavigate.bind(this);
        this.onUpdate = this.onUpdate.bind(this);
        this.refreshAndGoToLastPage = this.refreshAndGoToLastPage.bind(this);
        this.refreshCurrentPage = this.refreshCurrentPage.bind(this);
    }



    //fetch the collection, then use the URIs to retrieve each individual resource:
    loadFromServer(pageSize) {
        // follow() goes to the 'employees' collection resource.
        follow(client, root, [
                {rel: 'employees', params: {size: pageSize}}]
                //array of rel can be as simple as ["employees"]
            //Sometimes, a 'rel' by itself is not enough.
            //In this fragment of code, it also plugs in a query parameter of '?size=<pageSize>'

        // creates a call to fetch JSON Schema data
        ).then(employeeCollection => {
            return client({
                method: 'GET',
                path: employeeCollection.entity._links.profile.href,
                headers: {'Accept': 'application/schema+json'}
            // inner .then clause to store the metadata and navigational links in the <App/> component.
            }).then(schema => {
                this.schema = schema.entity;
                this.links = employeeCollection.entity._links;
                return employeeCollection;
                //returning employeeCollection so it can be passed onto the next call
                //...letting you grab the metadata along the way
            });

        // This is what you need to fetch an ETag header for each employee.
        // converts the collection of employees into an array of GET promises to fetch each individual resource.
        }).then(employeeCollection => {
            this.page = employeeCollection.entity.page;

            return employeeCollection.entity._embedded.employees.map(employee =>
                client({
                    method: 'GET',
                    path: employee._links.self.href
                })
            );

        //takes the array of GET promises and merges them into a single promise with when.all(),
        // ...which is resolved when all the GET promises are resolved.
        }).then(employeePromises => {
            return when.all(employeePromises);

        // wraps up: UI state is updated using this amalgamation of data
        }).then(employees => {
            this.setState({
                page: this.page,
                employees: employees,
                attributes: Object.keys(this.schema.properties),
                pageSize: pageSize,
                links: this.links
            });
        });
    }

    //create new employee record
    onCreate(newEmployee) {
        follow(client, root, ['employees']).done(response => {
            client({
                method: 'POST',
                path: response.entity._links.self.href,
                entity: newEmployee,
                headers: {'Content-Type': 'application/json'}
            })
        })
    }

    //Allow managing the state of the UI
    //Used to jump to different pages & fetch individual resources
    onNavigate(navUri) {
        client({
            method: 'GET',
            path: navUri
        }).then(employeeCollection => {
            this.links = employeeCollection.entity._links;
            this.page = employeeCollection.entity.page;

            return employeeCollection.entity._embedded.employees.map(employee =>
                client({
                    method: 'GET',
                    path: employee._links.self.href
                })
            );
        }).then(employeePromises => {
            return when.all(employeePromises);
        }).then(employees => {
            this.setState({
                page:this.page,
                employees: employees,
                attributes: Object.keys(this.schema.properties),
                pageSize: this.state.pageSize,
                links: this.links
            });
        });
    }

    //reloads the whole data from the server, applying the same page size.
    // ...then shows the first page.
    onDelete(employee) {
        client({
            method: 'DELETE',
            path: employee.entity._links.self.href
        }).then(response =>{
            this.loadFromServer(this.state.pageSize);
        });

    }



    onUpdate(employee, updatedEmployee) {
        client({
            method: 'PUT',
            path: employee.entity._links.self.href,
            entity: updatedEmployee,
            headers: {
                'Content-Type': 'application/json',
                'If-Match': employee.headers.Etag
            }
        }).then(response => {
            this.loadFromServer(this.state.pageSize);
        }, response => {
            if (response.status.code === 412) {
                alert('DENIED: Unable to update ' +
                    employee.entity._links.self.href + '. Your copy is stale.');
            }
        });
    }

    //Because a new page size value causes changes to all the navigation links, it's best to refetch the data and start from the beginning.
    updatePageSize(pageSize) {
        if (pageSize !== this.state.pageSize) {
            this.loadFromServer(pageSize);
        }
    }

    refreshAndGoToLastPage(message) {
        follow(client, root, [{
            rel: 'employees',
            params: {size: this.state.pageSize}
        }]).then(response => {
            if (response.entity._links.last !== undefined) {
                this.onNavigate(response.entity._links.last.href);
            } else {
                this.onNavigate(response.entity._links.self.href);
            }
        })
    }

    refreshCurrentPage(message) {
        follow(client, root, [{
            rel: 'employees',
            params: {
                size: this.state.pageSize,
                page: this.state.page.number
            }
        }]).then(employeeCollection => {
            this.links = employeeCollection.entity._links;
            this.page = employeeCollection.entity.page;

            return employeeCollection.entity._embedded.employees.map(employee => {
                return client({
                    method: 'GET',
                    path: employee._links.self.href
                })
            });
        }).then(employeePromises => {
            return when.all(employeePromises);
        }).then(employees => {
            this.setState({
                page: this.page,
                employees: employees,
                attributes: Object.keys(this.schema.properties),
                pageSize: this.state.pageSize,
                links: this.links
            });
        });
    }

    componentDidMount() {
        //calling the loadfromServer for loading
        // employees are fetched from the server using page size
        this.loadFromServer(this.state.pageSize);

        //Registering for WebSocket Events
        //array of JavaScript objects being registered for WebSocket events,
        stompClient.register([
            {route: '/topic/newEmployee', callback: this.refreshAndGoToLastPage},
            {route: '/topic/updateEmployee', callback: this.refreshCurrentPage},
            {route: '/topic/deleteEmployee', callback: this.refreshCurrentPage}
        ]);
    }

    render() {
        return (
            <div>
                <CreateDialog attributes={this.state.attributes} onCreate={this.onCreate}/>
                <EmployeeList page={this.state.page}
                              employees={this.state.employees}
                              links={this.state.links}
                              pageSize={this.state.pageSize}
                              attributes={this.state.attributes}
                              onNavigate={this.onNavigate}
                              onUpdate={this.onUpdate}
                              onDelete={this.onDelete}
                              updatePageSize={this.updatePageSize}/>
            </div>
        )
    }
}

//add some extra controls to the UI.
class CreateDialog extends React.Component {

    constructor(props) {
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleSubmit(e) {
        e.preventDefault(); //stops the event from bubbling further up the hierarchy
        const newEmployee = {};
        this.props.attributes.forEach(attribute => {
            newEmployee[attribute] = ReactDOM.findDOMNode(this.refs[attribute]).value.trim();
            // ...then uses the same JSON Schema attribute property to find each <input>
            //...using React.findDOMNode(this.refs[attribute]).
                //***Note: 'this.refs' is a way to reach out and grab a particular React component by name. Note that you are getting ONLY the virtual DOM component. To grab the actual DOM element, you need to use React.findDOMNode().
        });
        // After iterating over every input and building up the newEmployee object, we invoke a callback to onCreate() for the new employee record.
        this.props.onCreate(newEmployee);

        // clear out the dialog's inputs
        this.props.attributes.forEach(attribute => {
            ReactDOM.findDOMNode(this.refs[attribute]).value = '';
        });

        // Navigate away from the dialog to hide it.
        window.location = "#";
    }

    //maps over the JSON Schema data found in the attributes property
    // ...and converts it into an array of <p><input></p> elements.

    render() {
        //'key' to distinguish between multiple child nodes
        // ...using a simple text-based entry field
        // ...'placeholder' to show user which field is which
        // ...'ref' is the mechanism for grabbing a particular DOM node, instead of having a 'name' attribute
        const inputs = this.props.attributes.map(attribute =>
            <p key={attribute}>
                <input type="text" placeholder={attribute} ref={attribute} className="field"/>
            </p>
        );

        // a form where your dynamic list of input fields are injected followed by Create button
        //  onClick={this.handleSubmit} event handler (how React register an event handler)
        return (
            <div>
                <a href="#createEmployee">Create</a>

                <div id="createEmployee" className="modalDialog">
                    <div>
                        <a href="#" title="Close" className="close">X</a>

                        <h2>Create new employee</h2>
                        <form>
                            {inputs}
                            <button onClick={this.handleSubmit}>Create</button>
                        </form>
                    </div>
                </div>
            </div>
        )
    }

}

// edit existing employee records:
class UpdateDialog extends React.Component {

    constructor(props) {
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleSubmit(e) {
        e.preventDefault();
        const updatedEmployee = {};
        this.props.attributes.forEach(attribute => {
            //uses React.findDOMNode() to extract the details of the pop-up by using React refs.
            updatedEmployee[attribute] = ReactDOM.findDOMNode(this.refs[attribute]).value.trim();
        });
        //After the input values are extracted and loaded into the updatedEmployee object, the top-level onUpdate() method is invoked
        this.props.onUpdate(this.props.employee, updatedEmployee);
        window.location = "#";
    }

    //uses CSS/HTML tactic to show/hide dialog as CreateDialog
    //converts the array of JSON Schema attributes into an array of HTML inputs, wrapped in paragraph elements for styling
    //same as CreateDialog, but fields are loaded with 'this.props.employee'
    render() {
        const inputs = this.props.attributes.map(attribute =>
            <p key={this.props.employee.entity[attribute]}>
                <input type="text" placeholder={attribute}
                       defaultValue={this.props.employee.entity[attribute]}
                       ref={attribute} className="field"/>
            </p>
        );

        const dialogId = "updateEmployee-" + this.props.employee.entity._links.self.href;

        return (
            <div key={this.props.employee.entity._links.self.href}>
                <a href={"#" + dialogId}>Update</a>
                <div id={dialogId} className="modalDialog">
                    <div>
                        <a href="#" title="Close" className="close">X</a>

                        <h2>Update an employee</h2>

                        <form>
                            {inputs}
                            <button onClick={this.handleSubmit}>Update</button>
                        </form>
                    </div>
                </div>
            </div>
        )
    }

};

class EmployeeList extends React.Component{

    constructor(props) {
        super(props);
        this.handleNavFirst = this.handleNavFirst.bind(this);
        this.handleNavPrev = this.handleNavPrev.bind(this);
        this.handleNavNext = this.handleNavNext.bind(this);
        this.handleNavLast = this.handleNavLast.bind(this);
        this.handleInput = this.handleInput.bind(this);
    }

    handleInput(e) {
        e.preventDefault(); //stops the event from bubbling up
        //uses ref of <input> to find DOM node and extract its value through findDomNode()
        const pageSize = ReactDOM.findDOMNode(this.refs.pageSize).value;

        if (/^[0-9]+$/.test(pageSize)) { //test if input is a number
            this.props.updatePageSize(pageSize); //invokes callback && send new page size to App React component
        } else { // if not a number...
            //...the character just entered is stripped off the input.
            ReactDOM.findDOMNode(this.refs.pageSize).value =
                pageSize.substring(0, pageSize.length - 1);
        }
    }

    // Each of these handlers handle clicking on some buttons (render())
    // Each of these functions intercepts the default event and stops it from bubbling up.
    // ...Then it invokes onNavigate() with the proper hypermedia link.
    handleNavFirst(e){
        e.preventDefault();
        this.props.onNavigate(this.props.links.first.href);
    }

    handleNavPrev(e) {
        e.preventDefault();
        this.props.onNavigate(this.props.links.prev.href);
    }

    handleNavNext(e) {
        e.preventDefault();
        this.props.onNavigate(this.props.links.next.href);
    }

    handleNavLast(e) {
        e.preventDefault();
        this.props.onNavigate(this.props.links.last.href);
    }


    render() {
        const pageInfo = this.props.page.hasOwnProperty("number") ?
            <h3>Employees - Page {this.props.page.number + 1} of {this.props.page.totalPages}</h3> : null;

        const employees = this.props.employees.map(employee =>
            <Employee key={employee.entity._links.self.href}
                      employee={employee}
                      attributes={this.props.attributes}
                      onUpdate={this.props.onUpdate}
                      onDelete={this.props.onDelete}/>
        );

        const navLinks = [];
        if ("first" in this.props.links) {
            navLinks.push(<button key="first" onClick={this.handleNavFirst}>&lt;&lt;</button>);
        }
        if ("prev" in this.props.links) {
            navLinks.push(<button key="prev" onClick={this.handleNavPrev}>&lt;</button>);
        }
        if ("next" in this.props.links) {
            navLinks.push(<button key="next" onClick={this.handleNavNext}>&gt;</button>);
        }
        if ("last" in this.props.links) {
            navLinks.push(<button key="last" onClick={this.handleNavLast}>&gt;&gt;</button>);
        }

        return (
            <div>
                {pageInfo}
                <input ref="pageSize" defaultValue={this.props.pageSize} onInput={this.handleInput}/>
                <table>
                    <tbody>
                        <tr>
                            <th>First Name</th>
                            <th>Last Name</th>
                            <th>Description</th>
                            <th>Update</th>
                            <th>Delete</th>
                        </tr>
                         {employees}
                    </tbody>
                </table>
                <div>
                    {navLinks}
                </div>
            </div>
        )
    }
}

// DELETE EXISTING RECORDS
class Employee extends React.Component {

    constructor(props) {
        super(props);
        this.handleDelete = this.handleDelete.bind(this);
    }

    handleDelete() { //invoked the callback passed down when Delete button is clicked
        this.props.onDelete(this.props.employee);
        // ///while supplying the contextually important this.props.employee record.
    }

    render() {
        return (
            <tr>
                <td>{this.props.employee.entity.firstName}</td>
                <td>{this.props.employee.entity.lastName}</td>
                <td>{this.props.employee.entity.description}</td>
                <td>
                    <UpdateDialog employee={this.props.employee}
                                  attributes={this.props.attributes}
                                  onUpdate={this.props.onUpdate}/>
                </td>
                <td>
                    <button onClick={this.handleDelete}>Delete</button>
                </td>
            </tr>
        )
    }
}


ReactDOM.render(
    <App />,
    document.getElementById('react')
)