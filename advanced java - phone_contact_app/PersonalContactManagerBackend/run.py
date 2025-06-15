from app import create_app, db

import os
print("CURRENT WORKING DIRECTORY:", os.getcwd())


app = create_app()

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)

    print("Flask static_folder is set to:", app.static_folder)
    print("Flask static_url_path is:", app.static_url_path)
