package com.todo;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class TodoApiTest {
    @Autowired MockMvc mvc;

    private String login(String user) throws Exception {
        String body = mvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"" + user + "\",\"password\":\"password123\"}"))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();
        // crude extract
        int i = body.indexOf("\"token\":\"") + 9;
        int j = body.indexOf("\"", i);
        return body.substring(i, j);
    }

    @Test
    void successfulTodoOperation() throws Exception {
        String token = login("demo1");
        mvc.perform(post("/api/todos")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"Java test todo\"}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.title").value("Java test todo"));
    }

    @Test
    void cannotAccessOtherUserTodo() throws Exception {
        String t1 = login("demo1");
        String t2 = login("demo2");
        String created = mvc.perform(post("/api/todos")
                .header("Authorization", "Bearer " + t1)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"Private\"}"))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();
        // extract id roughly
        int idStart = created.indexOf("\"id\":") + 5;
        int idEnd = created.indexOf(",", idStart);
        String id = created.substring(idStart, idEnd).trim();

        mvc.perform(patch("/api/todos/" + id)
                .header("Authorization", "Bearer " + t2)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"completed\":true}"))
            .andExpect(status().isForbidden());
    }
}
