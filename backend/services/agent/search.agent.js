export const search = async (state) => {
  try {
    const results = await searchTool.invoke({
      query: state.prompt,
    });

    console.log(results);

    return {
      ...state,
      searchResults: results,
      images: results.images || [],
    };
  } catch (error) {
    console.error("Search error:", error);

    return {
      ...state,
      searchResults: [],
      images: [],
    };
  }
};