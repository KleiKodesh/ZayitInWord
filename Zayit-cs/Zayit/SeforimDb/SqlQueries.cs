using System;

namespace Zayit.SeforimDb
{
    public static class SqlQueries
    {
        public static string GetBookContent(int bookId) => $@"
            SELECT 
                content,
                id
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
            SELECT DISTINCT
                Id,
                ParentId,
                Title,
                Level
            FROM category
            WHERE Level = 0
        ";

        public static string GetChildCategories(int parentId) => $@"
            SELECT DISTINCT 
                Id,
                ParentId,
                Title,
                Level
            FROM category
            WHERE parentId = {parentId}
        ";

        public static string GetBooksByCategoryId(int categoryId) => $@"
            SELECT DISTINCT
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
            SELECT DISTINCT 
                Id,
                ParentId,
                Title,
                Level
            FROM category
        ";

        public static string GetCategoriesWithPath => @"
            WITH RECURSIVE CategoryPath AS (
                -- Base case: root categories (Level = 0)
                SELECT 
                    Id,
                    ParentId,
                    Title,
                    Level,
                    '' AS Path
                FROM category
                WHERE Level = 0
                
                UNION ALL
                
                -- Recursive case: child categories
                SELECT 
                    c.Id,
                    c.ParentId,
                    c.Title,
                    c.Level,
                    CASE 
                        WHEN cp.Path = '' THEN cp.Title
                        ELSE cp.Path || ' > ' || cp.Title
                    END AS Path
                FROM category c
                INNER JOIN CategoryPath cp ON c.ParentId = cp.Id
            )
            SELECT 
                Id,
                ParentId,
                Title,
                Level,
                Path
            FROM CategoryPath
            ORDER BY Level, Id
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

        public static string GetToc(int docId) => $@"
        SELECT DISTINCT
            te.id,
            te.bookId,
            te.parentId,
            te.textId,
            te.level,
            te.lineId,
            te.isLastChild,
            te.hasChildren,
            tt.text AS Text,
            l.lineIndex
        FROM tocEntry AS te
        LEFT JOIN tocText AS tt 
            ON te.textId = tt.id
        LEFT JOIN line AS l
            ON l.id = te.lineId
        WHERE te.bookId = {docId};
        ";

        public static string GetLinks(int lineId) => $@"
        SELECT
            l.targetLineId,
            l.targetBookId,
            l.connectionTypeId,
            bk.title,
            ln.content
        FROM link l
        JOIN line ln   ON ln.id = l.targetLineId
        JOIN book bk   ON bk.id = l.targetBookId
        WHERE l.sourceLineId = {lineId}
        ORDER BY l.connectionTypeId, bk.title
        ";        
    }
}
