package payroll;

import org.springframework.data.repository.PagingAndSortingRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.security.access.prepost.PreAuthorize;

@PreAuthorize("hasRole('ROLE_MANAGER')") //restricts access to people with ROLE_MANAGER.
public interface EmployeeRepository extends PagingAndSortingRepository<Employee, Long> {
    // Spring Data REST provides paging support: PagingAndSortingRepository
   //... which adds extra options to set page size and adds navigational links to hop from page to page


    //On save(), either the employee’s manager is null (initial creation of a new employee when no manager has been assigned),
    // ...or the employee’s manager’s name matches the currently authenticated user’s name
    @Override
    @PreAuthorize("#employee?.manager == null or #employee?.manager?.name == authentication?.name")
    Employee save(@Param("employee") Employee employee);



    //On delete(), the method either has access to only an id (or the next PreAuthorize), it must find the employeeRepository in the application context, perform a findOne(id),
    //...and check the manager against the currently authenticated user.
    @Override
    @PreAuthorize("@employeeRepository.findById(#id)?.manager?.name == authentication?.name")
    void deleteById(@Param("id") Long id);

    //"....or the method has access to the employee "
    @Override
    @PreAuthorize("#employee?.manager?.name == authentication?.name")
    void delete(@Param("employee") Employee employee);
}

// '?.' property navigator to handle null checks.
//@Param(…) on the arguments to link HTTP operations with the methods.

/*
The @PreAuthorize expressions applied to your repository are access rules.
These rules are for nought without a security policy: SecurityConfiguration.java
 */