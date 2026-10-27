CREATE DATABASE IF NOT EXISTS transaction_ledger;
USE transaction_ledger;

CREATE TABLE IF NOT EXISTS accounts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  CONSTRAINT chk_accounts_non_negative_balance CHECK (balance >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS transactions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id BIGINT UNSIGNED NOT NULL,
  type ENUM('credit', 'debit') NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  description VARCHAR(500) NOT NULL DEFAULT '',
  reference_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_transactions_account_reference (account_id, reference_id),
  KEY idx_transactions_account_created (account_id, created_at, id),
  CONSTRAINT chk_transactions_positive_amount CHECK (amount > 0),
  CONSTRAINT fk_transactions_account FOREIGN KEY (account_id) REFERENCES accounts (id)
) ENGINE=InnoDB;
