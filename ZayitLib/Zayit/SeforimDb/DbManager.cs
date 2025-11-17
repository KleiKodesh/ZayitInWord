
using System;
using System.Data;
using System.Data.SQLite;

namespace Zayit.SeforimDb
{
    public class DbManager : IDisposable
    {
        public readonly SQLiteConnection Connection;
        // Expose the connection as IDbConnection for Dapper
        public IDbConnection DapperConnection;
        public DbManager(string databasePath = "C:\\Users\\Admin\\AppData\\Roaming\\io.github.kdroidfilter.seforimapp\\databases\\seforim.db")
        {
            Connection = new SQLiteConnection($"Data Source={databasePath};Version=3;");
            Connection.Open();
            DapperConnection = Connection;
        }

        public void Dispose()
        {
            Connection?.Dispose();
        }
    }

}
