# Library Books API

This REST API manages books in a library.

## 1. List all books

- **Method:** GET
- **Path:** `/books`
- **Description:** Returns a list of all books.
- **Success status:** 200 OK

## 2. Get one book

- **Method:** GET
- **Path:** `/books/{id}`
- **Description:** Returns one book using its ID.
- **Success status:** 200 OK

## 3. Create a book

- **Method:** POST
- **Path:** `/books`
- **Description:** Creates a new book.
- **Example request body:**
```json
{
  "title": "Things Fall Apart",
  "author": "Chinua Achebe",
  "year": 1958
}