export async function getBookByISBN(isbn: string) {
  try {
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
    const data = await response.json();
    if (data.totalItems > 0) {
      const volumeInfo = data.items[0].volumeInfo;
      return {
        title: volumeInfo.title,
        author: volumeInfo.authors ? volumeInfo.authors.join(", ") : "Unknown Author",
        thumbnail: volumeInfo.imageLinks?.thumbnail || "",
        description: volumeInfo.description || "",
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching book from Google Books API:", error);
    return null;
  }
}
