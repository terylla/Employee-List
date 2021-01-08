package payroll;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

@Component
class SpringDataJpaUserDetailsService implements UserDetailsService {

    private final ManagerRepository repository;

    @Autowired
    public SpringDataJpaUserDetailsService(ManagerRepository repository) {
        this.repository = repository;
    }

    //loadUserByUsername() return a UserDetails object so that Spring Security can interrogate the user’s information.
    @Override
    public UserDetails loadUserByUsername(String name) throws UsernameNotFoundException {
        //loadUserByUsername() taps into the custom finder you wrote a moment ago, findByName() in ManagerRepository
        Manager manager = this.repository.findByName(name);
        //It then populates a Spring Security User instance, which implements the UserDetails interface
        return new User(manager.getName(), manager.getPassword(),
                    // also using Spring Security’s AuthorityUtils to transition from an array of string-based roles into a Java List of type GrantedAuthority.
                    AuthorityUtils.createAuthorityList(manager.getRoles()));
    }

}

/*
 A common point of integration with security is to define a UserDetailsService.
 This is the way to connect your user’s data store into a Spring Security interface.
 Spring Security needs a way to look up users for security checks, and this is the bridge

 Because you have a ManagerRepository, there is no need to write any SQL or JPA expressions to fetch this needed data.
 In this class, it is autowired by constructor injection
 */
