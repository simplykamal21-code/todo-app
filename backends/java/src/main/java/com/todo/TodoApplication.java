package com.todo;

import com.todo.model.User;
import com.todo.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class TodoApplication {
    public static void main(String[] args) {
        SpringApplication.run(TodoApplication.class, args);
    }

    @Bean
    CommandLineRunner seed(UserRepository users, PasswordEncoder encoder) {
        return args -> {
            if (users.count() == 0) {
                users.save(new User("demo1", encoder.encode("password123")));
                users.save(new User("demo2", encoder.encode("password123")));
                System.out.println("Seeded demo users: demo1 / demo2");
            }
        };
    }
}
