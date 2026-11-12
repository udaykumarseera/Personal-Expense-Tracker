package com.ledgr.service;

import com.ledgr.entity.Transaction;
import com.ledgr.repository.TransactionRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class TransactionService {
    private final TransactionRepository repository;

    public TransactionService(TransactionRepository repository) {
        this.repository = repository;
    }

    public List<Transaction> getAllTransactions() { return repository.findAll(); }

    public Transaction getTransactionById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new TransactionNotFoundException(id));
    }

    public Transaction createTransaction(Transaction transaction) { return repository.save(transaction); }

    public Transaction updateTransaction(Long id, Transaction updated) {
        Transaction existing = getTransactionById(id);
        existing.setDescription(updated.getDescription());
        existing.setType(updated.getType());
        existing.setCategory(updated.getCategory());
        existing.setAmount(updated.getAmount());
        existing.setDate(updated.getDate());
        return repository.save(existing);
    }

    public void deleteTransaction(Long id) {
        if (!repository.existsById(id)) {
            throw new TransactionNotFoundException(id);
        }
        repository.deleteById(id);
    }

    public List<Transaction> findByCategory(String category) {
        return repository.findByCategoryIgnoreCase(category);
    }

    public List<Transaction> search(String keyword) {
        return repository.findByDescriptionContainingIgnoreCase(keyword);
    }
}
