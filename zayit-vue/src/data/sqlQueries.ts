export const SqlQueries = {
  getBookContent: (bookId: number) => `
    SELECT content, id
    FROM line 
    WHERE bookId = ${bookId}
  `,

  getLines: (bookId: number, start: number, end: number) => `
    SELECT content
    FROM line
    WHERE bookId = ${bookId}
      AND lineIndex >= ${start}
      AND lineIndex <= ${end}
  `,

  getRootCategories: `
    SELECT DISTINCT
      Id,
      ParentId,
      Title,
      Level
    FROM category
    WHERE Level = 0
  `,

  getChildCategories: (parentId: number) => `
    SELECT DISTINCT 
      Id,
      ParentId,
      Title,
      Level
    FROM category
    WHERE parentId = ${parentId}
  `,

  getBooksByCategoryId: (categoryId: number) => `
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
    WHERE CategoryId = ${categoryId}
  `,

  getAllCategories: `
    SELECT DISTINCT 
      Id,
      ParentId,
      Title,
      Level
    FROM category
    ORDER BY Level, Id
  `,

  getCategoriesWithPath: `
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
  `,

  getAllBooks: `
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
    ORDER BY CategoryId
  `,

  getBooksByCategory: (title: string, useWildCards = false) => {
    const searchTitle = useWildCards ? `%${title}%` : title;
    return `
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
        WHERE c.Title LIKE '${searchTitle}'
      )
    `;
  },

  getToc: (docId: number) => `
    SELECT DISTINCT
      te.id,
      te.bookId,
      te.parentId,
      te.textId,
      te.level,
      te.lineId,
      te.isLastChild,
      te.hasChildren,
      tt.text,
      l.lineIndex
    FROM tocEntry AS te
    LEFT JOIN tocText AS tt ON te.textId = tt.id
    LEFT JOIN line AS l ON l.id = te.lineId
    WHERE te.bookId = ${docId}
  `,

  getLinks: (lineId: number) => `
    SELECT
      l.targetLineId,
      l.targetBookId,
      l.connectionTypeId,
      bk.title,
      ln.content,
      ln.lineIndex AS lineIndex
    FROM link l
    JOIN line ln ON ln.id = l.targetLineId
    JOIN book bk ON bk.id = l.targetBookId
    WHERE l.sourceLineId = ${lineId}
    ORDER BY l.connectionTypeId, bk.title
  `,

  getLineContent: (bookId: number, lineIndex: number) => `
    SELECT content 
    FROM line 
    WHERE bookId = ${bookId} AND lineIndex = ${lineIndex}
  `,

  getLineId: (bookId: number, lineIndex: number) => `
    SELECT id 
    FROM line 
    WHERE bookId = ${bookId} AND lineIndex = ${lineIndex}
  `,

  getBatchLineContent: (bookId: number, lineIndices: number[]) => {
    const placeholders = lineIndices.map(() => '?').join(',')
    return `
      SELECT lineIndex, content 
      FROM line 
      WHERE bookId = ${bookId} AND lineIndex IN (${placeholders})
    `
  },

  getBookLineCount: (bookId: number) => `
    SELECT TotalLines as totalLines
    FROM book 
    WHERE Id = ${bookId}
  `
}
