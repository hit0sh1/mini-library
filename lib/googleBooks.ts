export async function getBookByISBN(isbn: string) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY;
    const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}${apiKey ? `&key=${apiKey}` : ""}`;
    const response = await fetch(url);
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
