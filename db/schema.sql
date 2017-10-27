CREATE TABLE IF NOT EXISTS lists (
    listId BINARY(16) NOT NULL PRIMARY KEY,
    listName VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS listEvents (
    eventId BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    listId BINARY(16) NOT NULL,
    listVersion BIGINT UNSIGNED NOT NULL DEFAULT 1,
    eventData MEDIUMTEXT NOT NULL,
    occurredAt DATETIME NOT NULL,
    UNIQUE KEY (listId, listVersion)
);