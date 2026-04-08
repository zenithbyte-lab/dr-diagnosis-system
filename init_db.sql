CREATE DATABASE IF NOT EXISTS dr_diagnosis DEFAULT CHARACTER SET utf8mb4;
USE dr_diagnosis;

CREATE TABLE IF NOT EXISTS users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    real_name     VARCHAR(100) DEFAULT '',
    role          ENUM('admin', 'user') NOT NULL DEFAULT 'user',
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login    DATETIME     DEFAULT NULL,
    is_active     TINYINT(1)   NOT NULL DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS diagnoses (
    id                 INT AUTO_INCREMENT PRIMARY KEY,
    uid                VARCHAR(20)  NOT NULL UNIQUE,
    user_id            INT          NOT NULL,
    patient_name       VARCHAR(100) DEFAULT '',
    patient_age        INT          DEFAULT NULL,
    patient_gender     ENUM('male','female','other') DEFAULT NULL,
    eye_side           ENUM('left','right','unknown') DEFAULT 'unknown',
    original_image     VARCHAR(500) NOT NULL,
    heatmap_image      VARCHAR(500) NOT NULL,
    pred_class         TINYINT      NOT NULL,
    pred_label         VARCHAR(30)  NOT NULL,
    confidence         DECIMAL(5,2) NOT NULL,
    prob_no_dr         DECIMAL(5,2) NOT NULL,
    prob_mild          DECIMAL(5,2) NOT NULL,
    prob_moderate      DECIMAL(5,2) NOT NULL,
    prob_severe        DECIMAL(5,2) NOT NULL,
    prob_proliferative DECIMAL(5,2) NOT NULL,
    risk_level         VARCHAR(20)  NOT NULL,
    recommendation     TEXT,
    review_status      ENUM('pending','confirmed','rejected') DEFAULT 'pending',
    reviewer_id        INT          DEFAULT NULL,
    review_comment     TEXT         DEFAULT NULL,
    reviewed_at        DATETIME     DEFAULT NULL,
    created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (reviewer_id) REFERENCES users(id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_pred_class (pred_class)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reports (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    diagnosis_id  INT          NOT NULL UNIQUE,
    file_path     VARCHAR(500) NOT NULL,
    generated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (diagnosis_id) REFERENCES diagnoses(id) ON DELETE CASCADE
) ENGINE=InnoDB;
