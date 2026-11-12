package com.ledgr.userservice;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Stored user record. Never return this class from the API; use UserResponse. */
@Entity
@Table(name = "users") // "user" is a reserved word in several databases
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 100)
    @Column(nullable = false, length = 100)
    private String name;

    @NotBlank
    @Email
    @Column(nullable = false, unique = true, length = 150)
    private String email;

    // Holds the plain password on the way in and the BCrypt hash once stored.
    // The length limit applies to the incoming password; the hash is 60 chars.
    @NotBlank
    @Size(min = 6, max = 72, message = "must be between 6 and 72 characters")
    @Column(nullable = false)
    private String password;

    protected User() { }

    public User(String name, String email, String password) {
        this.name = name;
        this.email = email;
        this.password = password;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getPassword() { return password; }
    public void setName(String name) { this.name = name; }
    public void setEmail(String email) { this.email = email; }
    public void setPassword(String password) { this.password = password; }
}
