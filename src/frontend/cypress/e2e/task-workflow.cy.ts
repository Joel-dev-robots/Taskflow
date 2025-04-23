describe('Task Management Workflow', () => {
  // Test user credentials
  const testUser = {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User'
  };
  
  // We'll clean up and register a new user before tests
  before(() => {
    // Visit the homepage
    cy.visit('/');
    
    // If already logged in, log out
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="logout-button"]').length > 0) {
        cy.get('[data-testid="logout-button"]').click();
      }
    });
    
    // Go to register page
    cy.visit('/register');
    
    // Register a new account
    cy.get('input[name="name"]').type(testUser.name);
    cy.get('input[name="email"]').type(testUser.email);
    cy.get('input[name="password"]').type(testUser.password);
    cy.get('form').submit();
    
    // We should be redirected to the tasks page
    cy.url().should('include', '/tasks');
  });
  
  it('should create a new task', () => {
    // Click the create task button
    cy.get('button').contains('Create New Task').click();
    
    // Fill the task form
    cy.get('input[name="title"]').type('Test Task');
    cy.get('textarea[name="description"]').type('This is a test task created by Cypress');
    cy.get('select[name="status"]').select('pending');
    
    // Submit the form
    cy.get('form').submit();
    
    // We should be redirected back to tasks page
    cy.url().should('include', '/tasks');
    
    // The new task should be in the list
    cy.contains('Test Task').should('be.visible');
  });
  
  it('should view task details', () => {
    // Click on the task we just created
    cy.contains('Test Task').click();
    
    // We should be on the task detail page
    cy.url().should('include', '/tasks/');
    
    // Task details should be visible
    cy.contains('Test Task').should('be.visible');
    cy.contains('This is a test task created by Cypress').should('be.visible');
  });
  
  it('should add a comment to the task', () => {
    // Add a comment
    cy.get('textarea#new-comment').type('This is a test comment');
    cy.get('button').contains('Add Comment').click();
    
    // The comment should appear in the list
    cy.contains('This is a test comment').should('be.visible');
  });
  
  it('should edit the task', () => {
    // Click the edit button
    cy.get('button').contains('Edit').click();
    
    // Change the task title
    cy.get('input[name="title"]').clear().type('Updated Test Task');
    
    // Submit the form
    cy.get('form').submit();
    
    // The updated title should be visible
    cy.contains('Updated Test Task').should('be.visible');
  });
  
  it('should delete the task', () => {
    // Click the delete button
    cy.get('button').contains('Delete').click();
    
    // Confirm deletion in the dialog
    cy.get('button').contains('Yes, Delete').click();
    
    // We should be redirected to tasks page
    cy.url().should('include', '/tasks');
    
    // The task should no longer be in the list
    cy.contains('Updated Test Task').should('not.exist');
  });
}); 