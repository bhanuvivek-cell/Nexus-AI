-- Canonical Tech Skills for Indian Engineering & Tech Students

INSERT INTO public.skills (name, category, aliases) VALUES
-- Programming Languages
('Python', 'Programming Languages', ARRAY['py', 'python3']),
('C', 'Programming Languages', ARRAY['c language']),
('C++', 'Programming Languages', ARRAY['cpp', 'c plus plus']),
('Java', 'Programming Languages', ARRAY['core java', 'java8']),
('JavaScript', 'Programming Languages', ARRAY['js', 'es6', 'javascript']),
('TypeScript', 'Programming Languages', ARRAY['ts']),
('SQL', 'Programming Languages', ARRAY['structured query language', 'postgres', 'mysql']),
('Go', 'Programming Languages', ARRAY['golang']),
('Rust', 'Programming Languages', ARRAY['rustlang']),

-- Core Computer Science
('Data Structures & Algorithms', 'Core CS', ARRAY['dsa', 'data structures', 'algorithms']),
('Computer Networks', 'Core CS', ARRAY['networking', 'cn', 'tcp/ip']),
('Operating Systems', 'Core CS', ARRAY['os', 'linux internals']),
('Database Management Systems', 'Core CS', ARRAY['dbms', 'rdbms']),
('Object Oriented Programming', 'Core CS', ARRAY['oops', 'oop']),
('System Design', 'Core CS', ARRAY['high level design', 'low level design', 'distributed systems']),

-- Web Development
('React', 'Web Development', ARRAY['reactjs', 'react.js']),
('Node.js', 'Web Development', ARRAY['nodejs', 'node']),
('HTML/CSS', 'Web Development', ARRAY['html', 'css', 'html5', 'css3']),
('Tailwind CSS', 'Web Development', ARRAY['tailwind', 'tailwindcss']),
('FastAPI', 'Web Development', ARRAY['fast api', 'fastapi python']),
('Django', 'Web Development', ARRAY['django rest framework', 'drf']),
('Next.js', 'Web Development', ARRAY['nextjs']),
('REST APIs', 'Web Development', ARRAY['restful api', 'api development']),

-- AI & Data Science
('Machine Learning', 'AI & Data Science', ARRAY['ml', 'machine-learning']),
('Deep Learning', 'AI & Data Science', ARRAY['dl', 'neural networks']),
('Natural Language Processing', 'AI & Data Science', ARRAY['nlp', 'llm']),
('Computer Vision', 'AI & Data Science', ARRAY['cv', 'opencv', 'image processing']),
('PyTorch', 'AI & Data Science', ARRAY['torch']),
('TensorFlow', 'AI & Data Science', ARRAY['tf', 'keras']),
('Scikit-Learn', 'AI & Data Science', ARRAY['sklearn']),
('Pandas & NumPy', 'AI & Data Science', ARRAY['pandas', 'numpy', 'data manipulation']),
('Data Science & Analytics', 'AI & Data Science', ARRAY['data analytics', 'eda', 'data analysis']),

-- Cloud & DevOps
('Git & GitHub', 'DevOps & Tools', ARRAY['git', 'github', 'version control']),
('Linux', 'DevOps & Tools', ARRAY['ubuntu', 'bash', 'shell scripting']),
('Docker', 'Cloud & DevOps', ARRAY['containerization', 'containers']),
('Kubernetes', 'Cloud & DevOps', ARRAY['k8s']),
('AWS', 'Cloud & DevOps', ARRAY['amazon web services', 'ec2', 's3']),
('Microsoft Azure', 'Cloud & DevOps', ARRAY['azure']),
('Google Cloud Platform', 'Cloud & DevOps', ARRAY['gcp']),
('CI/CD', 'Cloud & DevOps', ARRAY['continuous integration', 'github actions', 'jenkins']),

-- Cybersecurity
('Cybersecurity', 'Cybersecurity', ARRAY['infosec', 'information security']),
('Network Security', 'Cybersecurity', ARRAY['firewalls', 'wireshark']),
('Ethical Hacking', 'Cybersecurity', ARRAY['penetration testing', 'pentesting', 'vapt']),

-- Mobile & Design
('Android Development', 'Mobile Development', ARRAY['android', 'kotlin android']),
('Flutter', 'Mobile Development', ARRAY['dart', 'flutter mobile']),
('React Native', 'Mobile Development', ARRAY['rn']),
('UI/UX Design', 'Design & Product', ARRAY['ui design', 'ux design', 'figma'])
ON CONFLICT (name) DO NOTHING;
