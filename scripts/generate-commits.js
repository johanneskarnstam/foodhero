import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputPath = path.join(__dirname, '../src/commits.json');
const publicPath = path.join(__dirname, '../public/commits.json');

async function fetchCommitsFromGitHub() {
    const repo = process.env.GITHUB_REPOSITORY || 'Jojjeboy/foodhero';
    const token = process.env.GITHUB_TOKEN || '';
    
    const url = `https://api.github.com/repos/${repo}/commits?per_page=20`;
    const headers = {
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'FoodHero-Commit-Generator',
        ...(token && { 'Authorization': `Bearer ${token}` }),
    };
    
    try {
        const response = await fetch(url, { headers });
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
        }
        const commits = await response.json();
        
        return commits.map(commit => ({
            hash: commit.sha,
            date: commit.commit.author.date,
            message: commit.commit.message.split('\n')[0],
        }));
    } catch (error) {
        console.error('Error fetching commits from GitHub API:', error);
        return [];
    }
}

async function fetchCommitsFromGitLab() {
    const projectId = process.env.CI_PROJECT_ID;
    const token = process.env.GITLAB_TOKEN || process.env.CI_JOB_TOKEN || '';
    const apiUrl = process.env.CI_API_V4_URL || 'https://gitlab.com/api/v4';
    
    if (!projectId) {
        console.error('GitLab CI_PROJECT_ID not set. Cannot fetch commits from GitLab API.');
        return [];
    }
    
    const url = `${apiUrl}/projects/${projectId}/repository/commits?per_page=20`;
    const headers = {
        'PRIVATE-TOKEN': token,
    };
    
    try {
        const response = await fetch(url, { headers });
        if (!response.ok) {
            throw new Error(`GitLab API error: ${response.status} ${response.statusText}`);
        }
        const commits = await response.json();
        
        return commits.map(commit => ({
            hash: commit.id,
            date: commit.committed_date,
            message: commit.message.split('\n')[0],
        }));
    } catch (error) {
        console.error('Error fetching commits from GitLab API:', error);
        return [];
    }
}

async function getCommitsFromGitLog() {
    try {
        const logOutput = execSync('git log -n 20 --pretty=format:"%H|%ad|%s" --date=iso', { encoding: 'utf-8' });
        
        return logOutput.split('\n').map(line => {
            const [hash, date, message] = line.split('|');
            if (!hash) return null;
            return { hash, date, message };
        }).filter(commit => commit !== null);
    } catch (error) {
        console.error('Error getting commits from git log:', error);
        return [];
    }
}

async function generateCommits() {
    let commits;
    
    // Use GitLab API in GitLab CI environments
    if (process.env.GITLAB_CI) {
        commits = await fetchCommitsFromGitLab();
    }
    // Use GitHub API in GitHub Actions
    else if (process.env.GITHUB_ACTIONS) {
        commits = await fetchCommitsFromGitHub();
    }
    // Use git log locally or in other CI environments
    else {
        commits = await getCommitsFromGitLog();
    }
    
    if (commits.length === 0) {
        console.warn('No commits found. Using empty array.');
    }
    
    const jsonContent = JSON.stringify(commits, null, 2);
    
    // Write to both src/ and public/ folders
    fs.writeFileSync(outputPath, jsonContent);
    fs.writeFileSync(publicPath, jsonContent);
    
    console.log(`Generated commits.json with ${commits.length} commits in src/ and public/.`);
}

generateCommits().catch(error => {
    console.error('Error generating commits.json:', error);
    // Create empty files as fallback
    const emptyContent = JSON.stringify([], null, 2);
    fs.writeFileSync(outputPath, emptyContent);
    fs.writeFileSync(publicPath, emptyContent);
});
