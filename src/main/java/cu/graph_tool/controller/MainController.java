package cu.graph_tool.controller;

import cu.graph_tool.exception.ProjectNotFoundException;
import cu.graph_tool.service.ProjectService;
import cu.graph_tool.util.Flash;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.ui.ModelMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import org.springframework.web.servlet.view.RedirectView;

import java.io.IOException;

@Controller
@RequestMapping("/")
public class MainController extends AbstractController {

    @Autowired
    ProjectService ps;

    @GetMapping()
    public String index(Model model, @ModelAttribute("flash") Object flash) {
        if (!(flash instanceof Flash)) {
            model.addAttribute("flash", null);
        }
        model.addAttribute("projects", ps.getProjects());
        return "index";
    }

}
