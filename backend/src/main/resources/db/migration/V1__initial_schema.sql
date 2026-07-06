CREATE TABLE "user" (
    userid SERIAL PRIMARY KEY,
    name VARCHAR(60) NOT NULL,
    username VARCHAR(32) UNIQUE NOT NULL,
    email VARCHAR(60) UNIQUE NOT NULL,
    password VARCHAR(60) NOT NULL,
    profile_picture VARCHAR(100) DEFAULT 'default_profile_picture.png',
    authenticated BOOLEAN DEFAULT FALSE,
    urole VARCHAR(20) DEFAULT 'user' CHECK (urole IN ('user', 'librarian'))
);

CREATE TABLE section (
    sectionid SERIAL PRIMARY KEY,
    title VARCHAR(60) UNIQUE NOT NULL,
    description VARCHAR(120) NOT NULL,
    picture VARCHAR(100) DEFAULT 'default_section_picture.jpeg',
    date_modified TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE book (
    bookid SERIAL PRIMARY KEY,
    title VARCHAR(60) UNIQUE NOT NULL,
    author VARCHAR(60) NOT NULL,
    description VARCHAR(120) NOT NULL,
    picture VARCHAR(100) DEFAULT 'default_book_picture.png',
    pdf_file VARCHAR(100) NOT NULL,
    sectionid INTEGER NOT NULL REFERENCES section(sectionid) ON DELETE CASCADE,
    date_modified TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE request (
    requestid SERIAL PRIMARY KEY,
    userid INTEGER NOT NULL REFERENCES "user"(userid) ON DELETE CASCADE,
    bookid INTEGER NOT NULL REFERENCES book(bookid) ON DELETE CASCADE,
    days INTEGER NOT NULL CHECK (days >= 1 AND days <= 7),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    date_modified TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE issuedbook (
    issueid SERIAL PRIMARY KEY,
    userid INTEGER NOT NULL REFERENCES "user"(userid) ON DELETE CASCADE,
    bookid INTEGER NOT NULL REFERENCES book(bookid) ON DELETE CASCADE,
    from_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    to_date TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'current' CHECK (status IN ('current', 'returned'))
);

CREATE TABLE feedback (
    feedbackid SERIAL PRIMARY KEY,
    userid INTEGER NOT NULL REFERENCES "user"(userid) ON DELETE CASCADE,
    bookid INTEGER NOT NULL REFERENCES book(bookid) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    content VARCHAR(200) NOT NULL,
    date_modified TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert a default librarian user (password should be changed or managed by Cognito, but kept for legacy sync if needed)
INSERT INTO "user" (name, username, email, password, urole) 
VALUES ('Admin', 'admin', 'admin@library.local', 'hashed_placeholder', 'librarian');
