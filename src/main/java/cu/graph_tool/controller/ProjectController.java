package cu.graph_tool.controller;

import cu.graph_tool.exception.ProjectCantBeLoaded;
import cu.graph_tool.exception.ProjectNotFoundException;
import cu.graph_tool.model.Project;
import cu.graph_tool.service.ProjectService;
import cu.graph_tool.util.Flash;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.ui.ModelMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import org.springframework.web.servlet.view.RedirectView;

import javax.servlet.http.HttpServletRequest;
import java.io.ByteArrayOutputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.springframework.http.MediaType.MULTIPART_FORM_DATA;

@Controller
@RequestMapping("/project")
public class ProjectController extends AbstractController {

    @Autowired
    ProjectService ps;

    @GetMapping()
    public String empty_project() {
        return "workspace";
    }

    @GetMapping("/{uuid}")
    public String project(@PathVariable("uuid") String uuid, Model model) {
        try {
            Project p = ps.getProject(uuid);
            model.addAttribute("p", p);
            flash(model, "Loaded project <span class='alert-link'>" + p.getName() + "</span>", Flash.FlashType.success);
        } catch (ProjectNotFoundException | ProjectCantBeLoaded | IOException p) {
            p.printStackTrace();
            flash(model, "Error: Can't open project, it maybe damaged.", Flash.FlashType.danger);
        }
        return "workspace";
    }

    @PostMapping()
    public String save(@RequestBody MultiValueMap<String, String> params, Model model) {
        Project p = new Project();
        p.readFrom(params);
        _save(model, p);
        return "workspace";
    }

    @PostMapping(value = "/{uuid}")
    public String save(@PathVariable("uuid") String uuid, @RequestBody MultiValueMap<String, String> params, Model model) {
        Project p = new Project();
        p.readFrom(params);
        p.setUuid(uuid);
        _save(model, p);
        return "workspace";
    }

    private void _save(Model model, Project p) {
        try {
            ps.saveProject(p);
            model.addAttribute("p", p);
            flash(model, "Project <span class='alert-link'>" + p.getName() + "</span> saved successfully.", Flash.FlashType.success);
        } catch (FileNotFoundException e) {
            e.printStackTrace();
            flash(model, "Could not save project.", Flash.FlashType.danger);
        }
    }

    @GetMapping("/{uuid}/dl")
    public ResponseEntity download(@PathVariable String uuid, @RequestParam String pname, HttpServletRequest request) {
        try {
            byte[] projectBytes = ps.getProjectAsByteArray(uuid);
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType("application/octet-stream"))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + pname + ".gtp\"")
                    .body(projectBytes);
        } catch (ProjectNotFoundException e) {
            e.printStackTrace();
            return new ResponseEntity(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (IOException e) {
            e.printStackTrace();
            return new ResponseEntity(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping(value = "/externalfile", consumes = "multipart/form-data")
    public ResponseEntity returnJson(@RequestParam("file") MultipartFile file) {
        try {
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType("application/octet-stream"))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getName() + "\"")
                    .body(file.getBytes());
        } catch (IOException e) {
            e.printStackTrace();
            return new ResponseEntity(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping(value = "/{uuid}/rm")
    public RedirectView remove(@PathVariable("uuid") String uuid, RedirectAttributes model) {
        try {
            ps.deleteProject(uuid);
            flash(model, "Project deleted.", Flash.FlashType.success);
        } catch (ProjectNotFoundException e) {
            e.printStackTrace();
            flash(model, "Could not remove project.", Flash.FlashType.danger);
        }
        return new RedirectView("/");
    }

    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    public RedirectView upload(@RequestParam("file") MultipartFile file, RedirectAttributes model) {
        String uuid;
        try {
            uuid = ps.storeUploadedFile(file);
        } catch (IOException e) {
            e.printStackTrace();
            flash(model, "Error uploading file.", Flash.FlashType.danger);
            return new RedirectView("/");
        }
        return new RedirectView("/project/" + uuid);
    }

}
