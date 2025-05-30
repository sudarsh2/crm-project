from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg2
import datetime


app = Flask(__name__)

# CORS Configuration - allow your frontend origin (adjust if needed)
CORS(
    app,
    resources={r"/*": {"origins": ["http://localhost:5173", "https://crm-project-1-916c.onrender.com"]}},  # Add deployed frontend too
    supports_credentials=True
)

def get_db_connection():
    try:
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),  # Use environment variable
            database=os.getenv('DB_NAME', 'crm'),
            user=os.getenv('DB_USER', 'postgres'),
            password=os.getenv('DB_PASSWORD', 'sudarsh@2025'),
            port=os.getenv('DB_PORT', '5432'),
            connect_timeout=5
        )
        return conn
    except psycopg2.Error as e:
        app.logger.error(f"Database connection error: {e}")
        raise

# Explicit OPTIONS handler for login (CORS preflight)
@app.route('/login', methods=['OPTIONS'])
def handle_options():
    return jsonify(), 200

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    return response

# Login endpoint
@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        if username == "admin" and password == "password":  # Example check
            return jsonify({
                "status": "success",
                "access_token": "generated_jwt_token",
                "redirect": "/dashboard"
            })
        else:
            return jsonify({
                "status": "error",
                "message": "Invalid credentials"
            }), 401
            
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/api/customers', methods=['GET'])
def handle_customers():
    """Handle GET requests for customers with pagination and filtering."""
    conn = None
    cur = None
    
    try:
        app.logger.info("Starting customers request handling")
        
        # Validate and parse parameters
        page, page_size = validate_pagination_params(request)
        offset = (page - 1) * page_size
        filters = request.args.to_dict()
        app.logger.info(f"Request params: page={page}, size={page_size}, filters={filters}")

        # Connect to database
        conn = get_db_connection()
        cur = conn.cursor()
        app.logger.info("Database connection established")

        # Build queries
        base_query = """
            SELECT 
                c.id, c.name, c.phone, c.email, c.company,
                c.address, c.notes, c.assigned_to,
                (SELECT COUNT(*) FROM follow_ups f WHERE f.customer_id = c.id) AS follow_up_count,
                (SELECT MAX(f.created_at) FROM follow_ups f WHERE f.customer_id = c.id) AS last_follow_up
            FROM customers c
        """
        
        where_clause, params = build_where_clause(filters)
        
        # Execute count query
        total_count = execute_count_query(conn, cur, where_clause, params)
        app.logger.info(f"Total customers found: {total_count}")

        # Execute main query
        customers = execute_customer_query(
            conn, cur, 
            base_query + where_clause + " ORDER BY c.name LIMIT %s OFFSET %s",
            params + [page_size, offset]
        )
        app.logger.info(f"Returning {len(customers)} customers")

        return build_success_response(page, page_size, total_count, customers)

    except ValueError as ve:
        app.logger.warning(f"Validation error: {str(ve)}")
        return jsonify({
            'status': 'error',
            'message': str(ve)
        }), 400
        
    except psycopg2.OperationalError as oe:
        app.logger.error(f"Database operational error: {str(oe)}")
        return jsonify({
            'status': 'error',
            'message': 'Database connection error',
            'error': str(oe)
        }), 503
        
    except psycopg2.Error as pe:
        app.logger.error(f"Database error: {str(pe)}")
        return jsonify({
            'status': 'error',
            'message': 'Database operation failed',
            'error': str(pe)
        }), 500
        
    except Exception as e:
        app.logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': 'Internal server error'
        }), 500
        
    finally:
        close_db_resources(cur, conn)

def validate_pagination_params(request):
    """Validate and return pagination parameters with safe defaults."""
    try:
        page = max(1, int(request.args.get('page', 1)))
        page_size = min(100, max(1, int(request.args.get('page_size', 10))))
        return page, page_size
    except ValueError as ve:
        app.logger.warning(f"Invalid pagination params: {str(ve)}")
        raise ValueError("Invalid pagination parameters")

def build_where_clause(filters):
    """Build SQL WHERE clause and parameters based on filters."""
    conditions = []
    params = []
    
    # Follow-up status filters
    if filters.get('followed_up') == '1' and filters.get('pending') != '1':
        conditions.append("EXISTS (SELECT 1 FROM follow_ups f WHERE f.customer_id = c.id)")
    elif filters.get('pending') == '1' and filters.get('followed_up') != '1':
        conditions.append("NOT EXISTS (SELECT 1 FROM follow_ups f WHERE f.customer_id = c.id)")
    
    # Search filter
    if filters.get('search'):
        search = filters['search'].strip().lower()
        conditions.append("(LOWER(c.name) LIKE %s OR LOWER(c.company) LIKE %s)")
        params.extend([f"%{search}%", f"%{search}%"])
    
    where_clause = f" WHERE {' AND '.join(conditions)}" if conditions else ""
    return where_clause, params

def execute_count_query(conn, cur, where_clause, params):
    """Execute count query and return total count."""
    try:
        count_query = f"SELECT COUNT(*) FROM customers c {where_clause}"
        app.logger.info(f"Count query: {count_query} with params {params}")
        
        cur.execute(count_query, params)
        return cur.fetchone()[0]
    except Exception as e:
        app.logger.error(f"Count query failed: {str(e)}")
        raise

def execute_customer_query(conn, cur, query, params):
    """Execute customer query and return formatted results."""
    try:
        app.logger.info(f"Main query: {query} with params {params}")
        
        cur.execute(query, params)
        rows = cur.fetchall()
        
        customers = []
        for row in rows:
            try:
                customers.append({
                    'id': row[0],
                    'name': row[1],
                    'phone': row[2] or '',
                    'email': row[3] or '',
                    'company': row[4] or '',
                    'address': row[5] or '',
                    'notes': row[6] or '',
                    'assigned_to': row[7] or '',
                    'follow_up_count': row[8] or 0,
                    'last_follow_up': row[9].strftime('%Y-%m-%d %H:%M') if row[9] else None
                })
            except Exception as e:
                app.logger.error(f"Error processing row: {str(e)}")
                continue
                
        return customers
    except Exception as e:
        app.logger.error(f"Customer query failed: {str(e)}")
        raise

def build_success_response(page, page_size, total_count, customers):
    """Build the success response JSON."""
    return jsonify({
        'status': 'success',
        'page': page,
        'page_size': page_size,
        'total_count': total_count,
        'total_pages': max(1, (total_count + page_size - 1) // page_size),
        'customers': customers
    })

def close_db_resources(cur, conn):
    """Safely close database resources with logging."""
    try:
        if cur:
            cur.close()
            app.logger.debug("Cursor closed")
        if conn:
            conn.close()
            app.logger.debug("Database connection closed")
    except Exception as e:
        app.logger.error(f"Error closing database resources: {str(e)}")


@app.route('/api/random_cold_calls', methods=['GET'])
def get_random_cold_calls():
    user_id = request.args.get('user_id', type=int)

    if not user_id:
        return jsonify({'error': 'user_id is required'}), 400
    user_id_str = str(user_id)

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        # Select 10 unassigned or uncalled customers randomly
        cur.execute('''
            SELECT c.id, c.name, c.phone, c.company, c.email
            FROM customers c
            LEFT JOIN follow_ups f ON c.id = f.customer_id
            WHERE f.customer_id IS NULL
              AND (c.assigned_to IS NULL OR c.assigned_to = %s)
            ORDER BY RANDOM()
            LIMIT 10;
        ''', (user_id_str,))

        customers = [
            {
                'id': row[0],
                'name': row[1],
                'phone': row[2],
                'company': row[3],
                'email': row[4]
            }
            for row in cur.fetchall()
        ]

        # Optionally assign these customers to the user
        customer_ids = [c['id'] for c in customers]
        if customer_ids:
            cur.execute('''
                UPDATE customers
                SET assigned_to = %s
                WHERE id = ANY(%s);
            ''', (user_id_str, customer_ids))
            conn.commit()

        return jsonify({'customers': customers})

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

@app.route('/api/dashboard_summary', methods=['GET'])
def dashboard_summary():
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Total customers
        cur.execute('SELECT COUNT(*) FROM customers;')
        total_customers = cur.fetchone()[0]

        # Followed up customers: customers who have at least one follow-up
        cur.execute('''
            SELECT COUNT(DISTINCT customer_id) FROM follow_ups;
        ''')
        followed_up = cur.fetchone()[0]

        # Pending follow-ups: customers who have NO follow-ups
        cur.execute('''
            SELECT COUNT(*) FROM customers
            WHERE id NOT IN (SELECT DISTINCT customer_id FROM follow_ups);
        ''')
        pending_follow_up = cur.fetchone()[0]

        return jsonify({
            "status": "success",
            "data": {
                "total_customers": total_customers,
                "followed_up": followed_up,
                "pending_follow_up": pending_follow_up
            }
        })

    except Exception as e:
        app.logger.error(f"Error in dashboard_summary: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to fetch dashboard summary",
            "error": str(e)
        }), 500
        
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

# Example Flask route
@app.route('/api/customers/<int:id>', methods=['GET'])
def get_customer(id):
    conn = get_db_connection()
    cur = conn.cursor()

    # Fetch customer
    cur.execute("""
        SELECT id, name, phone, email, company, address, notes
        FROM customers
        WHERE id = %s
    """, (id,))
    row = cur.fetchone()

    if not row:
        cur.close()
        conn.close()
        return jsonify({'error': 'Customer not found'}), 404

    customer = {
        'id': row[0],
        'name': row[1],
        'phone': row[2],
        'email': row[3],
        'company': row[4],
        'address': row[5],
        'notes': row[6]
    }

    # Fetch follow-ups
    cur.execute("""
        SELECT id, follow_up_date, remarks
        FROM follow_ups
        WHERE customer_id = %s
        ORDER BY follow_up_date DESC
    """, (id,))
    follow_up_rows = cur.fetchall()

    follow_ups = [
        {
            'id': r[0],
            'follow_up_date': r[1].strftime('%Y-%m-%d'),
            'remarks': r[2]
        }
        for r in follow_up_rows
    ]

    cur.close()
    conn.close()

    return jsonify({
        'customer': customer,
        'follow_ups': follow_ups
    })



@app.route('/api/follow_ups_today', methods=['GET'])
def get_todays_follow_ups():
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Example query - adjust based on your schema
    cur.execute('''
        SELECT f.id, f.remarks, f.follow_up_date,
       c.id AS customer_id, c.name AS customer_name, c.phone AS customer_phone,
       a.id AS assignment_id, a.status, u.id AS user_id, u.name AS user_name
FROM follow_ups f
JOIN customers c ON f.customer_id = c.id
LEFT JOIN follow_up_assignments a ON a.customer_id = f.customer_id AND a.follow_up_date = f.follow_up_date
LEFT JOIN users u ON a.user_id = u.id
WHERE f.follow_up_date = CURRENT_DATE
  AND (a.status IS NULL OR a.status != 'done')
ORDER BY f.follow_up_date;
    ''')
    
    rows = cur.fetchall()
    follow_ups = []
    for row in rows:
        follow_ups.append({
            'follow_up': {
                'id': row[0],
                'remarks': row[1],
                'follow_up_date': row[2].strftime('%Y-%m-%d')
            },
            'customer': {
                'id': row[3],
                'name': row[4],
                'phone': row[5]
            },
            'assignment': {
                'id': row[6],
                'status': row[7],
                'user': {
                    'id': row[8],
                    'name': row[9]
                } if row[8] else None
            } if row[6] else None
        })
    
    cur.close()
    conn.close()
    return jsonify({'follow_ups_today': follow_ups})

@app.route('/api/users', methods=['GET'])
def get_users():
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('SELECT id, name FROM users')
        users = [{'id': row[0], 'name': row[1]} for row in cur.fetchall()]
        return jsonify({'status': 'success', 'users': users})
    
    except Exception as e:
        app.logger.error(f"Error fetching users: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to fetch users',
            'error': str(e)
        }), 500
        
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

@app.route('/api/current_user', methods=['GET'])
def get_current_user():
    # This should come from your authentication system
    return jsonify({'user': {'id': 1, 'name': 'Admin'}})

@app.route('/api/follow_ups/<int:follow_up_id>/assign', methods=['POST'])
def assign_follow_up(follow_up_id):
    data = request.get_json()
    user_id = data['user_id']
    status = data.get('status', 'pending')
    remarks = data.get('remarks', '')

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('''
        INSERT INTO follow_up_assignments (customer_id, user_id, follow_up_date, status, remarks)
        SELECT customer_id, %s, follow_up_date, %s, %s
        FROM follow_ups
        WHERE id = %s
        RETURNING id;
    ''', (user_id, status, remarks, follow_up_id))
    
    assignment_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()

    return jsonify({'status': 'success', 'assignment_id': assignment_id})


@app.route('/api/assignments/<int:assignment_id>/mark_done', methods=['POST'])
def mark_assignment_done(assignment_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('''
        UPDATE assignments SET status = 'done' 
        WHERE id = %s
    ''', (assignment_id,))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({'status': 'success'})

@app.route('/api/customers/<int:customer_id>/follow_ups', methods=['POST'])
def add_follow_up(customer_id):
    conn = None
    cur = None
    try:
        # 1. Get and validate request data
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        remarks = data.get('remarks')
        if not remarks:
            return jsonify({"error": "Remarks are required"}), 400

        follow_up_date = data.get('follow_up_date')
        if not follow_up_date:  # If not provided, use today's date
            follow_up_date = datetime.date.today()
        else:  # If provided, parse it
            try:
                follow_up_date = datetime.datetime.strptime(follow_up_date, '%Y-%m-%d').date()
            except ValueError:
                return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

        # 2. Verify customer exists
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("SELECT id FROM customers WHERE id = %s", (customer_id,))
        if not cur.fetchone():
            return jsonify({"error": f"Customer {customer_id} not found"}), 404

        # 3. Insert the follow-up
        cur.execute('''
            INSERT INTO follow_ups (customer_id, remarks, follow_up_date)
            VALUES (%s, %s, %s)
            RETURNING id, follow_up_date, remarks, created_at
        ''', (customer_id, remarks, follow_up_date))
        
        result = cur.fetchone()
        conn.commit()
        
        return jsonify({
            "id": result[0],
            "customer_id": customer_id,
            "follow_up_date": result[1].strftime('%Y-%m-%d'),
            "remarks": result[2],
            "created_at": result[3].isoformat()
        }), 201

    except psycopg2.Error as e:
        app.logger.error(f"Database error: {e}")
        if conn:
            conn.rollback()
        return jsonify({"error": "Database operation failed", "details": str(e)}), 500
        
    except Exception as e:
        app.logger.error(f"Unexpected error: {e}")
        return jsonify({"error": "Internal server error"}), 500
        
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

@app.route('/api/customers/<int:customer_id>/assign', methods=['PUT'])
def assign_customer(customer_id):
    try:
        # Get authentication token
        token = request.headers.get('Authorization')
        if not token or not token.startswith('Bearer '):
            return jsonify({'error': 'Unauthorized'}), 401

        data = request.get_json()
        assigned_to = data.get('assigned_to')

        conn = get_db_connection()
        cur = conn.cursor()

        # Update the customer's assigned_to field
        cur.execute('''
            UPDATE customers 
            SET assigned_to = %s
            WHERE id = %s
            RETURNING id, name, assigned_to
        ''', (assigned_to, customer_id))

        updated_customer = cur.fetchone()
        if not updated_customer:
            conn.rollback()
            return jsonify({'error': 'Customer not found'}), 404

        conn.commit()
        return jsonify({
            'status': 'success',
            'customer': {
                'id': updated_customer[0],
                'name': updated_customer[1],
                'assigned_to': updated_customer[2]
            }
        })

    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if 'conn' in locals():
            conn.close()


@app.route('/')
def index():
    return jsonify({"message": "CRM Backend is running"}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
