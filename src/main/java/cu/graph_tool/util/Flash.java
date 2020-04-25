package cu.graph_tool.util;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Flash {

    private String msg;
    FlashType type;

    public enum FlashType {
        success, info, danger, warning
    }

    static public Flash get(String msg, FlashType type) {
        final Flash x = new Flash();
        x.setType(type);
        x.setMsg(msg);
        return x;
    }

    @Override
    public String toString() {
        return "Flash{" +
                "msg='" + msg + '\'' +
                ", type=" + type +
                '}';
    }
}
