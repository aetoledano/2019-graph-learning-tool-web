package cu.graph_tool.controller;

import cu.graph_tool.util.Flash;
import org.springframework.ui.Model;
import org.springframework.ui.ModelMap;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

public class AbstractController {

    public void flash(Model where, String msg, Flash.FlashType type) {
        where.addAttribute("flash", Flash.get(msg, type));
    }

    public void flash(ModelMap where, String msg, Flash.FlashType type) {
        where.addAttribute("flash", Flash.get(msg, type));
    }

    public void flash(RedirectAttributes where, String msg, Flash.FlashType type) {
        where.addFlashAttribute("flash", Flash.get(msg, type));
    }
}
