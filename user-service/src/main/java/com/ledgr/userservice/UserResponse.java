package com.ledgr.userservice;

/** What the API is allowed to return about a user: no password, no hash. */
public class UserResponse {
    private final Long id;
    private final String name;
    private final String email;

    public UserResponse(Long id, String name, String email) {
        this.id = id;
        this.name = name;
        this.email = email;
    }

    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getName(), user.getEmail());
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
}
