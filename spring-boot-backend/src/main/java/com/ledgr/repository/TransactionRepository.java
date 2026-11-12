package com.ledgr.repository;

import com.ledgr.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByCategoryIgnoreCase(String category);
    List<Transaction> findByDescriptionContainingIgnoreCase(String description);
}
