package payroll;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.rest.core.annotation.HandleAfterCreate;
import org.springframework.data.rest.core.annotation.HandleAfterDelete;
import org.springframework.data.rest.core.annotation.HandleAfterSave;
import org.springframework.data.rest.core.annotation.RepositoryEventHandler;
import org.springframework.hateoas.server.EntityLinks;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import static payroll.WebSocketConfiguration.MESSAGE_PREFIX;

//import static payroll.WebSocketConfiguration.MESSAGE_PREFIX;

@Component
@RepositoryEventHandler(Employee.class) //flags this class to trap events based on employees.
public class EventHandler {

    private final SimpMessagingTemplate websocket;

    //EntityLinks comes with several utility methods to programmatically find the paths of various resources, whether single or for collections.
    private final EntityLinks entityLinks;


    //SimpMessagingTemplate and EntityLinks are autowired from the application context.
    @Autowired
    public EventHandler(SimpMessagingTemplate websocket, EntityLinks entityLinks) {
        this.websocket = websocket;
        this.entityLinks = entityLinks;
    }

    //*** @HandleXYZ annotations flag the methods that need to listen to events. These methods must be public

    //Each of these handler methods invokes SimpMessagingTemplate.convertAndSend() to transmit a message over the WebSocket.
    //...This is a pub-sub approach so that one message is relayed to every attached consumer.

    //The route of each message is different, allowing multiple messages to be sent to distinct receivers on the client
    // ...while needing only one open WebSocket - a resource-efficient approach.

   @HandleAfterCreate
    public void newEmployee(Employee employee) {
        this.websocket.convertAndSend(
                MESSAGE_PREFIX + "/newEmployee", getPath(employee));
    }
    //getPath() uses Spring Data REST’s EntityLinks to look up the path for a given class type and id.
    //...To serve the client’s needs, this Link object is converted to a Java URI with its path extracted.

    @HandleAfterDelete
    public void deleteEmployee(Employee employee) {
        this.websocket.convertAndSend(
                MESSAGE_PREFIX + "/deleteEmployee", getPath(employee));
    }

    @HandleAfterSave
    public void updateEmployee(Employee employee) {
        this.websocket.convertAndSend(
                MESSAGE_PREFIX + "/updateEmployee", getPath(employee));
    }
    //*****************

    /**
     * Take an {@link Employee} and get the URI using Spring Data REST's {@link EntityLinks}.
     *
     * @param employee
     */
    private String getPath(Employee employee) {
        return this.entityLinks.linkForItemResource(employee.getClass(),
                employee.getId()).toUri().getPath();
    }

}