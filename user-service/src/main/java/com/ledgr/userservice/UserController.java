package com.ledgr.userservice;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public List<UserResponse> getAllUsers() {
        return userService.getAllUsers().stream().map(UserResponse::from).toList();
    }

    @PostMapping
    public ResponseEntity<UserResponse> registerUser(@Valid @RequestBody User user) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(UserResponse.from(userService.registerUser(user)));
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");

        if (email == null || email.isBlank() || password == null || password.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Email and password are required."));
        }

        return userService.loginUser(email, password)
                .<ResponseEntity<?>>map(user -> ResponseEntity.ok(UserResponse.from(user)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Invalid email or password.")));
    }
}
