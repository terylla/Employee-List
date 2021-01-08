package payroll;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller // makes this class a Spring MVC controller
public class HomeController {

    @RequestMapping(value = "/")  //flags index() to support / route
    public String index() {
        return "index"; // returns "index" as name of template
        // Spring Boot’s autoconfigured view resolver will map to src/main/resources/templates/index.html.
    }

}
