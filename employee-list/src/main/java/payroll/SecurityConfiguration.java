package payroll;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;

@Configuration
@EnableWebSecurity //tells Spring Boot to drop its autoconfigured security policy and use this one instead. For quick demos, autoconfigured security is okay. But for anything real, you should write the policy yourself.
@EnableGlobalMethodSecurity(prePostEnabled = true) // turns on method-level security with Spring Security’s sophisticated @Pre and @Post annotations.
// Extends WebSecurityConfigurerAdapter, a handy base class for writing policy.
public class SecurityConfiguration extends WebSecurityConfigurerAdapter {

    // Autowires the SpringDataJpaUserDetailsService by field injection
    @Autowired
    private SpringDataJpaUserDetailsService userDetailsService;
    //...then plugs it in through the configure(AuthenticationManagerBuilder) method
    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        auth
                .userDetailsService(this.userDetailsService)
                .passwordEncoder(Manager.PASSWORD_ENCODER); //PASSWORD_ENCODER from Manager is also set up.
    }


    // The pivotal security policy is written in pure Java with the configure(HttpSecurity) method call.
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
                .authorizeRequests()
                //Paths listed in antMatchers() are granted unconditional access, since there is no reason to block static web resources.
                .antMatchers("/built/**", "/main.css").permitAll()
                //...anything that does not match that policy falls hinto anyRequest().authenticated
                //...meaning it requires authentication
                .anyRequest().authenticated()
                .and()

                //With those access rules set up, Spring Security is told to use form-based authentication
                .formLogin()
                //...defaulting to / upon success)
                .defaultSuccessUrl("/", true)
                //...and to grant access to the login page.
                .permitAll()
                .and()

                //BASIC login
                .httpBasic()
                .and()
                //...is also configured with CSRF disabled
                .csrf().disable()
                //Logout is configured to take the user to /
                .logout()
                .logoutSuccessUrl("/");
    }

}