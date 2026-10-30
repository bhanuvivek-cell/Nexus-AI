-- Verified Learning Resources for Engineering & Tech Students
-- Trusted Providers: AWS Skill Builder, Microsoft Learn, Google Cloud Skills Boost, NPTEL, freeCodeCamp

INSERT INTO public.learning_resources (
    id, title, provider, description, skill_name, official_url, is_free, cost_details, difficulty_level, verification_status
) VALUES
(
    '22222222-2222-2222-2222-222222222201',
    'Introduction to Containers and Docker',
    'AWS Skill Builder',
    'Learn fundamental container concepts, image creation, multi-stage builds, and deployment on AWS container services. Verified official digital training.',
    'Docker',
    'https://explore.skillbuilder.aws/learn/course/external/view/elearning/14470',
    true,
    'Free Digital Course',
    'beginner',
    'verified'
),
(
    '22222222-2222-2222-2222-222222222202',
    'Microsoft Azure Fundamentals (AZ-900) Official Path',
    'Microsoft Learn',
    'Official Microsoft learning modules covering cloud computing principles, Azure core architecture services, governance, security, and compliance.',
    'Microsoft Azure',
    'https://learn.microsoft.com/en-us/training/paths/microsoft-azure-fundamentals-describe-cloud-concepts/',
    true,
    'Free Official Learning Path',
    'beginner',
    'verified'
),
(
    '22222222-2222-2222-2222-222222222203',
    'Deep Learning with PyTorch Fundamentals',
    'Microsoft Learn',
    'Hands-on path to build deep learning models with PyTorch. Covers Tensors, Datasets & DataLoaders, Transforms, Neural Network architectures, and Model Training.',
    'PyTorch',
    'https://learn.microsoft.com/en-us/training/paths/pytorch-fundamentals/',
    true,
    'Free Interactive Sandbox',
    'intermediate',
    'verified'
),
(
    '22222222-2222-2222-2222-222222222204',
    'Google Cloud Fundamentals: Core Infrastructure',
    'Google Cloud Skills Boost',
    'Learn Google Cloud compute engine, Kubernetes Engine, VPC networking, Cloud Storage, and IAM access management through verified lab sandboxes.',
    'Google Cloud Platform',
    'https://www.cloudskillsboost.google/course_templates/60',
    true,
    'Free Quest Access',
    'beginner',
    'verified'
),
(
    '22222222-2222-2222-2222-222222222205',
    'Programming, Data Structures and Algorithms using Python',
    'NPTEL / IIT Madras',
    'Comprehensive Indian university academic course taught by IIT Madras faculty covering asymptotic analysis, sorting, search trees, graphs, and dynamic programming.',
    'Data Structures & Algorithms',
    'https://nptel.ac.in/courses/106106145',
    true,
    'Free to Audit',
    'intermediate',
    'verified'
),
(
    '22222222-2222-2222-2222-222222222206',
    'Relational Databases and SQL Certification',
    'freeCodeCamp',
    'Interactive Linux container-based terminal learning path covering PostgreSQL, SQL joins, database constraints, normalization, and bash database scripting.',
    'SQL',
    'https://www.freecodecamp.org/learn/relational-database/',
    true,
    '100% Free Verified Certificate',
    'beginner',
    'verified'
),
(
    '22222222-2222-2222-2222-222222222207',
    'Introduction to Linux (LFS101x)',
    'The Linux Foundation',
    'Official introductory curriculum by The Linux Foundation. Develop a good working knowledge of Linux using both the graphical interface and command line.',
    'Linux',
    'https://www.edx.org/learn/linux/the-linux-foundation-introduction-to-linux',
    true,
    'Free Audit Mode',
    'beginner',
    'verified'
),
(
    '22222222-2222-2222-2222-222222222208',
    'Building Modern REST APIs with FastAPI',
    'FastAPI Official Documentation',
    'Official tutorial series and interactive API development documentation for building production-grade asynchronous Python APIs with Pydantic and OpenAPI.',
    'FastAPI',
    'https://fastapi.tiangolo.com/tutorial/',
    true,
    'Free Official Documentation',
    'beginner',
    'verified'
),
(
    '22222222-2222-2222-2222-222222222209',
    'Computer Networks: Top-Down Architecture',
    'NPTEL / IIT Kharagpur',
    'Rigorous Indian academic course covering OSI layers, TCP/UDP protocols, routing algorithms, DNS, HTTP, and socket programming principles.',
    'Computer Networks',
    'https://nptel.ac.in/courses/106105183',
    true,
    'Free Academic Access',
    'intermediate',
    'verified'
),
(
    '22222222-2222-2222-2222-222222222210',
    'Kubernetes Basics & Architecture Workshop',
    'Kubernetes Official Docs',
    'Interactive walkthrough covering cluster creation, application deployment, Pods and Nodes, Services, Scaling, and Rolling updates.',
    'Kubernetes',
    'https://kubernetes.io/docs/tutorials/kubernetes-basics/',
    true,
    'Free Official Interactive Docs',
    'intermediate',
    'verified'
)
ON CONFLICT (id) DO NOTHING;
