package payroll;

import org.springframework.data.repository.Repository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

// You do NOT want this repository exposed for REST operations
// Apply 'exported = false' to prevent repository and its metadata from being served up
@RepositoryRestResource(exported = false)
//To save data, extend Repository (no predefined operations) instead of CrudRepository
public interface ManagerRepository extends Repository<Manager, Long> {

    Manager save(Manager manager);

    Manager findByName(String name);

}