package cu.graph_tool.exception;

public class ProjectNotFoundException extends Throwable {

    int statusCode;

    public ProjectNotFoundException(String message, int statusCode) {
        super(message);
        this.statusCode = statusCode;
    }

}
