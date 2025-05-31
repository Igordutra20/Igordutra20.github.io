from flask import Flask, request, jsonify 
from flask_cors import CORS 
import re 
import random 
import smtplib 
import sqlite3 
from email.mime.text import MIMEText

app = Flask(name) CORS(app)

Banco de dados SQLite

conn = sqlite3.connect('usuarios.db', check_same_thread=False) cursor = conn.cursor() cursor.execute(''' CREATE TABLE IF NOT EXISTS usuarios ( id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, email TEXT UNIQUE, senha TEXT, confirmado BOOLEAN, codigo_verificacao TEXT ) ''') conn.commit()

Validação de senha

def senha_valida(senha): return bool(re.match(r'^(?=.[A-Z])(?=.\d)(?=.*[\W_]).{8,}$', senha))

Envio de e-mail

def enviar_email(destinatario, codigo): remetente = "seuemail@gmail.com" senha_email = "suasenha"

msg = MIMEText(f"Seu código de verificação é: {codigo}")
msg['Subject'] = "Verificação de E-mail - Enchanted Legends"
msg['From'] = remetente
msg['To'] = destinatario

with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
    smtp.login(remetente, senha_email)
    smtp.send_message(msg)

@app.route('/api/registro', methods=['POST']) def registrar(): dados = request.get_json() username = dados.get('username') email = dados.get('email') senha = dados.get('senha')

if not username or not email or not senha:
    return jsonify({'erro': 'Campos obrigatórios'}), 400

if not senha_valida(senha):
    return jsonify({'erro': 'Senha inválida'}), 400

cursor.execute("SELECT * FROM usuarios WHERE email = ?", (email,))
if cursor.fetchone():
    return jsonify({'erro': 'E-mail já cadastrado'}), 400

cursor.execute("SELECT * FROM usuarios WHERE username = ?", (username,))
if cursor.fetchone():
    return jsonify({'erro': 'Nome de usuário já em uso'}), 400

codigo = str(random.randint(100000, 999999))

try:
    enviar_email(email, codigo)
except Exception as e:
    return jsonify({'erro': f'Erro ao enviar e-mail: {str(e)}'}), 500

cursor.execute("INSERT INTO usuarios (username, email, senha, confirmado, codigo_verificacao) VALUES (?, ?, ?, ?, ?)",
               (username, email, senha, False, codigo))
conn.commit()

return jsonify({'mensagem': 'Código enviado para o e-mail.'}), 200

@app.route('/api/confirmar', methods=['POST']) def confirmar(): dados = request.get_json() email = dados.get('email') codigo = dados.get('codigo')

cursor.execute("SELECT * FROM usuarios WHERE email = ?", (email,))
user = cursor.fetchone()

if not user:
    return jsonify({'erro': 'E-mail não encontrado'}), 404

if user[5] != codigo:
    return jsonify({'erro': 'Código incorreto'}), 400

cursor.execute("UPDATE usuarios SET confirmado = ?, codigo_verificacao = NULL WHERE email = ?", (True, email))
conn.commit()

return jsonify({'mensagem': 'E-mail confirmado com sucesso!'}), 200

if name == 'main': app.run(debug=True)

