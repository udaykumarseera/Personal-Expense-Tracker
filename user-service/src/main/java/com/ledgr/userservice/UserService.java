package com.ledgr.userservice;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User registerUser(User user) {
        user.setName(user.getName().trim());
        user.setEmail(normalizeEmail(user.getEmail()));
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new DuplicateEmailException();
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    public Optional<User> loginUser(String email, String password) {
        return userRepository.findByEmail(normalizeEmail(email))
                .filter(user -> passwordEncoder.matches(password, user.getPassword()));
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }
}
