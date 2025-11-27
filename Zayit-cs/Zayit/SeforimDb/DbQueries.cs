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

        /// <summary>
        /// Get flat category and book data from database
        /// Tree building is done in JavaScript using shared treeBuilder utility
        /// </summary>
        public static (object CategoriesFlat, object BooksFlat) GetTreeData()
        {
            // Use recursive CTE to get all categories with their full path
            var categoriesFlat = _db?.DapperConnection
                .Query(SqlQueries.GetCategoriesWithPath)
                .ToArray();

            // Get all books in a single query
            var booksFlat = _db?.DapperConnection
                .Query(SqlQueries.GetAllBooks)
                .ToArray();

            return (categoriesFlat, booksFlat);
        }

        /// <summary>
        /// Get flat TOC data from database
        /// Tree building is done in JavaScript using shared tocBuilder utility
        /// </summary>
        public static object GetTocData(int docId)
        {
            var tocEntriesFlat = _db?.DapperConnection
                .Query(SqlQueries.GetToc(docId))
                .ToArray();

            return tocEntriesFlat;
        }

        public static JoinedLink[] GetLinks(int lineId) =>
                _db?.DapperConnection
                    .Query<JoinedLink>(SqlQueries.GetLinks(lineId))
                    .ToArray();

    }
}
