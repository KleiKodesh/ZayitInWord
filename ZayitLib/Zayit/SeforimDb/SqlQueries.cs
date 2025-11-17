using System;

namespace Zayit.SeforimDb
{
    public static class SqlQueries
    {
        public static string GetBookContent(int bookId) => $@"
            SELECT content 
            FROM line 
            WHERE bookId = {bookId}
        ";

        public static string GetLines(int bookId, int start, int end) => $@"
            SELECT content
            FROM line
            WHERE bookId = {bookId}
              AND lineIndex >= {start}
              AND lineIndex <= {end}
        ";

        public static string GetRootCategories => @"
            SELECT 
                Id,
                ParentId,
                Title,
                Level
            FROM category
            WHERE Level = 0
        ";

        public static string GetChildCategories(int parentId) => $@"
            SELECT 
                Id,
                ParentId,
                Title,
                Level
            FROM category
            WHERE parentId = {parentId}
        ";

        public static string GetBooksByCategoryId(int categoryId) => $@"
            SELECT 
                Id,
                CategoryId,
                Title,
                HeShortDesc,
                OrderIndex,
                TotalLines,
                HasTargumConnection,
                HasReferenceConnection,
                HasCommentaryConnection,
                HasOtherConnection
            FROM book 
            WHERE CategoryId = {categoryId}
        ";

        public static string GetAllCategories => @"
            SELECT 
                Id,
                ParentId,
                Title,
                Level
            FROM category
        ";

        public static string GetAllBooks => @"
            SELECT 
                Id,
                CategoryId,
                Title,
                HeShortDesc,
                OrderIndex,
                TotalLines,
                HasTargumConnection,
                HasReferenceConnection,
                HasCommentaryConnection,
                HasOtherConnection
            FROM book
        ";

        /// <summary>
        /// Get category by title, all its descendant categories,
        /// and all books inside these categories.
        /// </summary>
        public static string GetBooksByCategory(string title, bool useWildCards = false)
        {
            if (useWildCards)
                title = $"%{title}%";

            return $@"
                SELECT DISTINCT
                    b.Id,
                    b.CategoryId,
                    b.Title,
                    b.HeShortDesc,
                    b.OrderIndex,
                    b.TotalLines,
                    b.HasTargumConnection,
                    b.HasReferenceConnection,
                    b.HasCommentaryConnection,
                    b.HasOtherConnection
                FROM book AS b
                WHERE b.CategoryId IN (
                    SELECT DISTINCT cc.descendantId
                    FROM category c
                    JOIN category_closure cc ON cc.ancestorId = c.Id
                    WHERE c.Title LIKE '{title}'
                );
            ";
        }
    }
}
