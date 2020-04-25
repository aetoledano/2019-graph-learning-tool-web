package cu.graph_tool.service;

import cu.graph_tool.exception.ProjectCantBeLoaded;
import cu.graph_tool.exception.ProjectNotFoundException;
import cu.graph_tool.model.Project;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.annotation.PostConstruct;
import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantReadWriteLock;

@Service
public class ProjectService {

    private File root;
    private Path rootPath;
    private ConcurrentHashMap<String, String> projects;
    private HashMap<String, ReentrantReadWriteLock> flocks;
    private ReentrantReadWriteLock memlock;

    @PostConstruct
    private void initialization() throws IOException {
        memlock = new ReentrantReadWriteLock();
        flocks = new HashMap<>();

        projects = new ConcurrentHashMap<>();

        root = new File("projects");
        if (!root.exists()) root.mkdir();

        rootPath = root.toPath();

        BufferedReader reader;
        String pname;
        for (File f : root.listFiles()) {
            reader = new BufferedReader(new FileReader(f));
            pname = reader.readLine();
            projects.put(f.getName(), pname);
            flocks.put(f.getName(), new ReentrantReadWriteLock());
            reader.close();
        }
    }

    public boolean saveProject(Project p) throws FileNotFoundException {
        if (p.getUuid() == null) {
            p.setUuid(UUID.randomUUID().toString());
            write2file(p);
            memlock.writeLock().lock();
            projects.put(p.getUuid(), p.getName());
            flocks.put(p.getUuid(), new ReentrantReadWriteLock());
            memlock.writeLock().unlock();
        } else {
            memlock.readLock().lock();
            ReentrantReadWriteLock lock = flocks.get(p.getUuid());
            memlock.readLock().unlock();
            if (lock != null) {
                lock.writeLock().lock();
                try {
                    write2file(p);
                } finally {
                    lock.writeLock().unlock();
                }
            } else {
                return false;
            }
        }
        return true;
    }

    public String storeUploadedFile(MultipartFile file) throws IOException {
        String uuid = UUID.randomUUID().toString();
        Path targetLocation = rootPath.resolve(uuid);
        Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

        BufferedReader reader = new BufferedReader(new FileReader(targetLocation.toFile()));
        String pname = reader.readLine();
        reader.close();

        memlock.writeLock().lock();
        projects.put(uuid, pname);
        flocks.put(uuid, new ReentrantReadWriteLock());
        memlock.writeLock().unlock();

        return uuid;
    }

    public Project getProject(String uuid) throws IOException, ProjectNotFoundException, ProjectCantBeLoaded {
        memlock.readLock().lock();
        ReentrantReadWriteLock lock = flocks.get(uuid);
        memlock.readLock().unlock();
        if (lock == null)
            throw new ProjectNotFoundException("Project " + uuid + " could not be found", 404);

        Project p = new Project();
        p.setUuid(uuid);
        lock.readLock().lock();
        try {
            read2object(p);
        } finally {
            lock.readLock().unlock();
        }
        return p;
    }

    public byte[] getProjectAsByteArray(String uuid) throws ProjectNotFoundException, IOException {
        memlock.readLock().lock();
        ReentrantReadWriteLock lock = flocks.get(uuid);
        memlock.readLock().unlock();
        if (lock == null)
            throw new ProjectNotFoundException("Project " + uuid + " could not be found", 404);
        lock.readLock().lock();
        try {
            return read2byteArray(uuid);
        } finally {
            lock.readLock().unlock();
        }
    }

    public boolean deleteProject(String uuid) throws ProjectNotFoundException {
        memlock.writeLock().lock();
        ReentrantReadWriteLock lock = flocks.remove(uuid);
        projects.remove(uuid);
        memlock.writeLock().unlock();

        boolean deleted = false;
        File f = new File(root, uuid);
        lock.writeLock().lock();
        try {
            if (f.exists()) deleted = f.delete();
        } finally {
            lock.writeLock().unlock();
        }
        return deleted;
    }

    public Map<String, String> getProjects() {
        return projects;
    }

    private void write2file(Project p) throws FileNotFoundException {
        File x = new File(root, p.getUuid());
        PrintWriter writer = new PrintWriter(x);
        writer.println(p.toSaveString());
        writer.close();
    }

    private void read2object(Project p) throws IOException {
        File x = new File(root, p.getUuid());
        BufferedReader reader = new BufferedReader(new FileReader(x));
        p.setName(reader.readLine());
        p.setGraph(reader.readLine());
        p.setCam(reader.readLine());
        p.setState(reader.readLine());
        reader.close();
    }

    private byte[] read2byteArray(String uuid) throws IOException {
        Path x = rootPath.resolve(uuid);
        ByteArrayOutputStream stream = new ByteArrayOutputStream();
        Files.copy(x, stream);
        return stream.toByteArray();
    }
}
