package com.ledgr.config;

import com.ledgr.entity.Transaction;
import com.ledgr.entity.TransactionType;
import com.ledgr.service.TransactionService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Inserts the original Ledgr sample entries on startup, but only when the
 * table is empty, so real data is never duplicated or overwritten.
 * Remove this class once you no longer want demo data.
 */
@Configuration
public class SampleDataLoader {

    @Bean
    CommandLineRunner loadSampleTransactions(TransactionService service) {
        return args -> {
            if (!service.getAllTransactions().isEmpty()) return;
            List.of(
                tx("Monthly Salary",        TransactionType.INCOME,  "Salary",    45000, "2026-08-01"),
                tx("Groceries at Nilgiris", TransactionType.EXPENSE, "Food",       1850, "2026-08-03"),
                tx("Auto & Metro Pass",     TransactionType.EXPENSE, "Transport",   900, "2026-08-04"),
                tx("Electricity Bill",      TransactionType.EXPENSE, "Bills",      2100, "2026-08-06"),
                tx("Freelance Web Project", TransactionType.INCOME,  "Freelance",  8000, "2026-08-08"),
                tx("New Headphones",        TransactionType.EXPENSE, "Shopping",   2400, "2026-08-10"),
                tx("Pharmacy",              TransactionType.EXPENSE, "Health",      560, "2026-08-12"),
                tx("Dinner Out",            TransactionType.EXPENSE, "Food",       1200, "2026-08-14"),
                tx("Mobile Recharge",       TransactionType.EXPENSE, "Bills",       449, "2026-08-15"),
                tx("Bus Pass Top-up",       TransactionType.EXPENSE, "Transport",   500, "2026-08-17")
            ).forEach(service::createTransaction);
        };
    }

    private static Transaction tx(String description, TransactionType type, String category,
                                  int amount, String date) {
        Transaction t = new Transaction();
        t.setDescription(description);
        t.setType(type);
        t.setCategory(category);
        t.setAmount(BigDecimal.valueOf(amount));
        t.setDate(LocalDate.parse(date));
        return t;
    }
}
