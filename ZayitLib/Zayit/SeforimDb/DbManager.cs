
using System;
using System.Data;
using System.Data.SQLite;
using System.IO;

namespace Zayit.SeforimDb
{
    public class DbManager : IDisposable
    {
        public readonly SQLiteConnection Connection;
        // Expose the connection as IDbConnection for Dapper
        public IDbConnection DapperConnection;

        public DbManager(string databasePath = null)
        {
            if (string.IsNullOrWhiteSpace(databasePath))
            {
                var appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);

                databasePath = Path.Combine(
                    appData,
                    "io.github.kdroidfilter.seforimapp",
                    "databases",
                    "seforim.db"
                );
            }

            if (!File.Exists(databasePath))
            {
                throw new FileNotFoundException("Database file not found", databasePath);
            }
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
