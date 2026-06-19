/**
 * FAQ Dataset — Stored centrally and loaded by the NLP FAQ Matcher.
 * Categories: General AI, CodeAlpha Internship, Programming, NLP, Career, General Knowledge
 */

import type { FaqItem } from "./nlp";

export const FAQ_DATA: FaqItem[] = [
  // === AI & Chatbots ===
  { id: 1, question: "What is artificial intelligence?", answer: "Artificial Intelligence (AI) is the simulation of human intelligence processes by computer systems. It includes learning, reasoning, problem-solving, perception, and language understanding." },
  { id: 2, question: "What is a chatbot?", answer: "A chatbot is a software application designed to simulate human conversation. It can be rule-based or powered by AI/NLP to understand and respond to natural language." },
  { id: 3, question: "What is machine learning?", answer: "Machine Learning is a subset of AI where systems learn from data without being explicitly programmed. Algorithms identify patterns and improve their performance through experience." },
  { id: 4, question: "What is deep learning?", answer: "Deep learning is a subset of machine learning using neural networks with many layers (hence 'deep'). It excels at tasks like image recognition, speech processing, and NLP." },
  { id: 5, question: "What is natural language processing?", answer: "Natural Language Processing (NLP) is a branch of AI that enables computers to understand, interpret, and generate human language. It powers chatbots, translation, sentiment analysis, and more." },
  { id: 6, question: "What is Gemini AI?", answer: "Gemini is Google's most capable AI model family, designed for multimodal understanding (text, code, images, audio, video). It powers this chatbot's AI responses." },
  { id: 7, question: "What is the difference between AI and ML?", answer: "AI is the broad concept of machines simulating intelligence. Machine Learning is a specific technique within AI where machines learn from data. All ML is AI, but not all AI is ML." },
  { id: 8, question: "What is a neural network?", answer: "A neural network is a computational model inspired by the human brain. It consists of layers of interconnected nodes (neurons) that process data and learn patterns for tasks like classification and prediction." },
  { id: 9, question: "What is GPT?", answer: "GPT (Generative Pre-trained Transformer) is a large language model developed by OpenAI. It generates human-like text and is the technology behind ChatGPT." },
  { id: 10, question: "What is a large language model?", answer: "A Large Language Model (LLM) is an AI system trained on massive amounts of text data. It can generate, summarize, translate, and reason about language. Examples include GPT-4, Gemini, and Claude." },

  // === NLP Concepts ===
  { id: 11, question: "What is tokenization in NLP?", answer: "Tokenization is the process of breaking text into smaller units called tokens (words, subwords, or characters). It's the first step in most NLP pipelines." },
  { id: 12, question: "What is TF-IDF?", answer: "TF-IDF (Term Frequency–Inverse Document Frequency) is a numerical statistic used in NLP to reflect how important a word is to a document relative to a collection. It's used for text similarity and search." },
  { id: 13, question: "What is cosine similarity?", answer: "Cosine similarity measures the angle between two vectors in a multi-dimensional space. In NLP, it compares text documents by treating them as vectors, where a score of 1 means identical and 0 means completely different." },
  { id: 14, question: "What are stop words?", answer: "Stop words are common words (e.g., 'the', 'is', 'and') that carry little meaningful information. NLP systems often remove them to focus on the content-bearing words in text." },
  { id: 15, question: "What is sentiment analysis?", answer: "Sentiment analysis is an NLP technique that identifies the emotional tone of text — positive, negative, or neutral. It's used in social media monitoring, customer feedback analysis, and more." },
  { id: 16, question: "What is intent detection?", answer: "Intent detection is the process of identifying the purpose behind a user's message. For example, 'Book me a flight' has the intent 'book_flight'. It's core to chatbot and virtual assistant systems." },
  { id: 17, question: "What is named entity recognition?", answer: "Named Entity Recognition (NER) identifies and classifies named entities in text — such as people, organizations, locations, and dates — into predefined categories." },
  { id: 18, question: "What is text preprocessing?", answer: "Text preprocessing transforms raw text into a clean format for NLP models. Steps include: lowercasing, removing punctuation, tokenization, stop word removal, stemming/lemmatization." },

  // === CodeAlpha Internship ===
  { id: 19, question: "What is CodeAlpha?", answer: "CodeAlpha is a technology company that offers virtual internship programs for students and fresh graduates in areas like programming, AI, web development, and data science." },
  { id: 20, question: "What are the CodeAlpha internship tasks?", answer: "CodeAlpha internship tasks typically include building real-world projects such as AI chatbots, stock price predictors, credit scoring systems, language translators, and music recommendation systems." },
  { id: 21, question: "How long is the CodeAlpha internship?", answer: "The CodeAlpha virtual internship typically runs for 1 month. Interns complete assigned tasks and submit their work through GitHub." },
  { id: 22, question: "What technologies are used in CodeAlpha projects?", answer: "CodeAlpha projects use technologies like Python, Java, JavaScript, machine learning libraries (scikit-learn, TensorFlow), web frameworks (Flask, Spring Boot), and AI APIs." },
  { id: 23, question: "What is this chatbot project?", answer: "This is a professional AI Chatbot built for the CodeAlpha internship. It features a ChatGPT-like interface, NLP-powered FAQ matching using TF-IDF cosine similarity, Gemini AI integration, voice input/output, chat history, and PDF export." },

  // === Programming & Java ===
  { id: 24, question: "What is Java?", answer: "Java is a high-level, class-based, object-oriented programming language designed to be platform-independent. It follows 'write once, run anywhere' (WORA) using the Java Virtual Machine (JVM)." },
  { id: 25, question: "What is MVC architecture?", answer: "MVC (Model-View-Controller) is a software design pattern that separates an application into three components: Model (data/logic), View (UI), and Controller (handles requests). It promotes clean, maintainable code." },
  { id: 26, question: "What is REST API?", answer: "A REST API (Representational State Transfer) is an architectural style for web services. It uses standard HTTP methods (GET, POST, PUT, DELETE) to perform operations on resources over a network." },
  { id: 27, question: "What is TypeScript?", answer: "TypeScript is a strongly-typed superset of JavaScript developed by Microsoft. It adds static types, interfaces, and advanced tooling to JavaScript, catching errors at compile time rather than runtime." },
  { id: 28, question: "What is Node.js?", answer: "Node.js is a JavaScript runtime built on Chrome's V8 engine. It enables JavaScript to run on the server side, making it possible to build scalable, fast backend applications." },
  { id: 29, question: "What is React?", answer: "React is a JavaScript library developed by Facebook for building user interfaces. It uses a component-based architecture and a virtual DOM for efficient UI updates." },

  // === Career & Learning ===
  { id: 30, question: "How do I become a software engineer?", answer: "To become a software engineer: (1) Learn a programming language (Python, Java, JavaScript), (2) Study data structures and algorithms, (3) Build projects, (4) Contribute to open source, (5) Apply for internships and jobs." },
  { id: 31, question: "What is GitHub?", answer: "GitHub is a web-based platform for version control and collaboration using Git. Developers use it to host code, track changes, collaborate on projects, and showcase their portfolio." },
  { id: 32, question: "What is data science?", answer: "Data science is an interdisciplinary field that uses statistics, programming, and domain knowledge to extract insights from structured and unstructured data. It combines ML, visualization, and analytics." },
  { id: 33, question: "What skills are important for AI?", answer: "Key skills for AI include: Python programming, mathematics (linear algebra, calculus, statistics), machine learning, deep learning frameworks (TensorFlow, PyTorch), data preprocessing, and cloud platforms." },

  // === General Knowledge ===
  { id: 34, question: "What is the internet?", answer: "The Internet is a global network of interconnected computers that communicate using standardized protocols (TCP/IP). It enables web browsing, email, streaming, social media, and billions of connected services." },
  { id: 35, question: "What is cloud computing?", answer: "Cloud computing delivers computing services (servers, storage, databases, networking, AI) over the internet. Major providers include AWS, Google Cloud, and Microsoft Azure." },
  { id: 36, question: "What is cybersecurity?", answer: "Cybersecurity is the practice of protecting computers, networks, and data from digital attacks, unauthorized access, and damage. It includes encryption, firewalls, authentication, and security auditing." },
  { id: 37, question: "What is blockchain?", answer: "Blockchain is a distributed ledger technology where data is stored in blocks chained together cryptographically. It's the foundation of cryptocurrencies like Bitcoin and enables trustless, transparent transactions." },
  { id: 38, question: "What is the difference between frontend and backend?", answer: "Frontend refers to the visual, client-side part of a web application that users see and interact with (HTML, CSS, JavaScript, React). Backend is the server-side logic, database, and API that power it (Node.js, Java, Python, SQL)." },
  { id: 39, question: "What is an API?", answer: "An API (Application Programming Interface) is a set of rules that allows different software applications to communicate. It defines how requests are made and what responses look like." },
  { id: 40, question: "What is open source?", answer: "Open source software has its source code publicly available for anyone to view, use, modify, and distribute. Examples include Linux, React, Python, and VS Code." },
];
