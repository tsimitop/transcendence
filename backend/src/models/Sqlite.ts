import Database from "better-sqlite3";

class Sqlite {
  constructor(private _dbPath: string) {}

  openDb() {
    const db = new Database(this._dbPath);
    return db;
  }
}

export default Sqlite;
