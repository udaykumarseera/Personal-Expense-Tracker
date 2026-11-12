package com.ledgr.controller;

import com.ledgr.entity.Transaction;
import com.ledgr.service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {
    private final TransactionService service;

    public TransactionController(TransactionService service) {
        this.service = service;
    }

    @GetMapping
    public List<Transaction> getAll(@RequestParam(required = false) String category,
                                    @RequestParam(required = false) String search) {
        if (category != null && !category.isBlank()) return service.findByCategory(category);
        if (search != null && !search.isBlank()) return service.search(search);
        return service.getAllTransactions();
    }

    @GetMapping("/{id}")
    public Transaction getById(@PathVariable Long id) { return service.getTransactionById(id); }

    @PostMapping
    public ResponseEntity<Transaction> create(@Valid @RequestBody Transaction transaction) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createTransaction(transaction));
    }

    @PutMapping("/{id}")
    public Transaction update(@PathVariable Long id, @Valid @RequestBody Transaction transaction) {
        return service.updateTransaction(id, transaction);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteTransaction(id);
        return ResponseEntity.noContent().build();
    }
}
