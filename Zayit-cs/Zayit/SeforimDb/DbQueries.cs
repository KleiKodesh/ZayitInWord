using Dapper;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using Zayit.Models;

namespace Zayit.SeforimDb
{
    public static class DbQueries
    {
        static readonly DbManager _db = new DbManager();

        public static IEnumerable<(string Content, int Id)> GetBookContentWithId(int bookId)
        {
            return _db?.DapperConnection
                .Query<(string, int)>(SqlQueries.GetBookContent(bookId));
        }

        public static (Category[] Tree, Book[] AllBooks) BuildTree()
        {
            // Categories must already be sorted in preorder
            var allCategories = _db?.DapperConnection
                .Query<Category>(SqlQueries.GetAllCategories)
                .ToArray();

            var allBooks = new List<Book>();
            var roots = new List<Category>();
            var stack = new Stack<Category>();

            foreach (var cat in allCategories)
            {
                // Pop finished parent categories
                while (stack.Count > 0 && stack.Peek().Id != cat.ParentId)
                {
                    var finishedParent = stack.Pop();
                    AssignBooksToCategory(finishedParent, allBooks);
                }

                if (stack.Count == 0)
                    roots.Add(cat);
                else
                {
                    var parent = stack.Peek();
                    parent.Children.Add(cat);
                    cat.FullCategory = parent.FullCategory + parent.Title + " / ";
                }

                stack.Push(cat);
            }

            // Handle remaining items in the stack
            while (stack.Count > 0)
            {
                var leaf = stack.Pop();
                AssignBooksToCategory(leaf, allBooks);
            }

            return (roots.ToArray(), allBooks.ToArray());
        }

        private static void AssignBooksToCategory(Category category, List<Book> allBooks)
        {
            if (category.Children.Count == 0) // Only assign to leaf categories
            {
                category.Books = _db?.DapperConnection
                    .Query<Book>(SqlQueries.GetBooksByCategoryId(category.Id))
                    .ToArray();

                foreach (var book in category.Books)
                    book.FullCategory = category.FullCategory + category.Title + " / ";

                allBooks.AddRange(category.Books);
            }
        }

        public static (TocEntry[] Tree, TocEntry[] AllTocs) GetTocTree(int docId)
        {
            var allEntries = _db?.DapperConnection
                .Query<TocEntry>(SqlQueries.GetToc(docId))
                .ToArray();

            // Build tree directly from list
            var tree = BuildChildren(null, allEntries).ToArray();

            return (tree, allEntries);
        }

        private static TocEntry[] BuildChildren(int? parentId, TocEntry[] items)
        {
            var parent = items.FirstOrDefault(t => t.Id == parentId);

            // Find direct children
            var children = items
                .Where(t => t.ParentId == parentId)
                .ToArray();

            foreach (var child in children)
            {
                // Build path from parent's path + parent's text
                if (parent != null)
                {
                    if (!string.IsNullOrEmpty(parent.Path))
                        child.Path = parent.Path + parent.Text + " / ";
                    else
                        child.Path = parent.Text + " / ";
                }

                if (child.HasChildren)
                    child.Children = BuildChildren(child.Id, items) ?? Array.Empty<TocEntry>();
            }

            return children;
        }

        public static JoinedLink[] GetLinks(int lineId) =>
                _db?.DapperConnection
                    .Query<JoinedLink>(SqlQueries.GetLinks(lineId))
                    .ToArray();

    }
}
