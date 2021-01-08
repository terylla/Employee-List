package payroll;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.rest.core.annotation.HandleBeforeCreate;
import org.springframework.data.rest.core.annotation.HandleBeforeSave;
import org.springframework.data.rest.core.annotation.RepositoryEventHandler;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RepositoryEventHandler(Employee.class) //flags this event handler as applying only to Employee objects
public class SpringDataRestEventHandler {

    private final ManagerRepository managerRepository;

    @Autowired
    public SpringDataRestEventHandler(ManagerRepository managerRepository) {
        this.managerRepository = managerRepository;
    }

    @HandleBeforeCreate //gives you a chance to alter the incoming Employee record before it gets written to the database.
    @HandleBeforeSave
    public void applyUserInformationUsingSecurityContext(Employee employee) {

        String name = SecurityContextHolder.getContext().getAuthentication().getName();
        // look up the associated manager by using findByName() and apply it to the manage
        Manager manager = this.managerRepository.findByName(name);
        //create a new manager if that person does not exist in the system yet.
        if (manager == null) {
            Manager newManager = new Manager();
            newManager.setName(name);
            newManager.setRoles(new String[]{"ROLE_MANAGER"});
            manager = this.managerRepository.save(newManager);
        }
        employee.setManager(manager);
    }
}

/*
 There is a little extra glue code to create a new manager if that person does not exist in the system yet.
 However, that is mostly to support initialization of the database.
 In a real production system, that code should be removed and instead depend on the DBAs or Security Ops team to properly maintain the user data store.
 */