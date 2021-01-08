package payroll;

import com.fasterxml.jackson.annotation.JsonIgnore;

import javax.persistence.*;
import java.util.Objects;

@Entity //JPA annotation that denotes the whole class for storage in a relational table.
public class Employee {

    //@Id and @GeneratedValue are JPA annotations to note the primary key and that is generated automatically when needed.
    private @Id @GeneratedValue Long id;
    private String firstName;
    private String lastName;
    private String description;

    // The version field is annotated with javax.persistence.Version.
    // It causes a value to be automatically stored and updated every time a row is inserted and updated.
    private @Version @JsonIgnore Long version;



    //he manager attribute is linked by JPA’s @ManyToOne attribute. Manager does not need the @OneToMany, because you have not defined the need to look that up.
    private @ManyToOne Manager manager;

  //  private payroll.Employee() {}
    public Employee() {

    }

    public Employee(String firstName, String lastName, String description, Manager manager) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.description = description;
        this.manager = manager;
    }



    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Employee employee = (Employee) o;
        return Objects.equals(id, employee.id) &&
                Objects.equals(firstName, employee.firstName) &&
                Objects.equals(lastName, employee.lastName) &&
                Objects.equals(description, employee.description) &&
                Objects.equals(version, employee.version);
    }

    @Override
    public int hashCode() {

        return Objects.hash(id, firstName, lastName, description, version);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }

    public Manager getManager() {
        return manager;
    }

    public void setManager(Manager manager) {
        this.manager = manager;
    }

    @Override
    public String toString() {
        return "Employee{" +
                "id=" + id +
                ", firstName='" + firstName + '\'' +
                ", lastName='" + lastName + '\'' +
                ", description='" + description + '\'' +
                ", version=" + version +
                ", manager=" + manager +
                '}';
    }
}
