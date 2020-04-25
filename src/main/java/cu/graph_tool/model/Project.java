package cu.graph_tool.model;

import lombok.Data;
import org.springframework.util.MultiValueMap;

import java.lang.reflect.Field;

@Data
public class Project {

    String uuid, name, graph, cam, state;

    public void readFrom(MultiValueMap<String, String> params) {
        try {
            for (Field f : Project.class.getDeclaredFields()) {
                f.setAccessible(true);
                f.set(this, params.getFirst(f.getName()));
            }
        } catch (IllegalAccessException e) {
            e.printStackTrace();
        }
    }

    public String toSaveString() {
        return name + "\n" + graph + "\n" + cam + "\n" + state;
    }
}
