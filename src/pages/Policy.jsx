// Policy & Compliance Pages for Solora StayCo
import React from 'react';
import { useParams } from 'react-router-dom';

function Policy() {
  const { type } = useParams();

  const policies = {
    privacy: {
      title: 'Privacy Policy',
      content: `
        <h2>Privacy Policy</h2>
        <p>Last updated: ${new Date().toLocaleDateString()}</p>
        
        <h3>1. Information We Collect</h3>
        <p>We collect information that you provide directly to us, including:</p>
        <ul>
          <li>Name, email address, and phone number</li>
          <li>Payment information</li>
          <li>Booking and reservation details</li>
          <li>Profile information and preferences</li>
        </ul>
        
        <h3>2. How We Use Your Information</h3>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Provide, maintain, and improve our services</li>
          <li>Process transactions and send related information</li>
          <li>Send technical notices and support messages</li>
          <li>Respond to your comments and questions</li>
        </ul>
        
        <h3>3. Information Sharing</h3>
        <p>We do not sell, trade, or rent your personal information to third parties.</p>
        
        <h3>4. Data Security</h3>
        <p>We implement appropriate security measures to protect your personal information.</p>
      `,
    },
    terms: {
      title: 'Terms of Service',
      content: `
        <h2>Terms of Service</h2>
        <p>Last updated: ${new Date().toLocaleDateString()}</p>
        
        <h3>1. Acceptance of Terms</h3>
        <p>By accessing and using Solora StayCo, you accept and agree to be bound by these Terms of Service.</p>
        
        <h3>2. Use of Service</h3>
        <p>You agree to use the service only for lawful purposes and in accordance with these Terms.</p>
        
        <h3>3. Bookings and Cancellations</h3>
        <p>All bookings are subject to availability and confirmation. Cancellation policies vary by listing.</p>
        
        <h3>4. Host Responsibilities</h3>
        <p>Hosts are responsible for providing accurate listing information and maintaining their properties.</p>
        
        <h3>5. Guest Responsibilities</h3>
        <p>Guests are responsible for respecting the property and following house rules.</p>
      `,
    },
    compliance: {
      title: 'Compliance & Safety',
      content: `
        <h2>Compliance & Safety</h2>
        
        <h3>Safety Standards</h3>
        <p>All listings must meet basic safety requirements including:</p>
        <ul>
          <li>Working smoke detectors</li>
          <li>First aid kit availability</li>
          <li>Emergency contact information</li>
          <li>Clear exit routes</li>
        </ul>
        
        <h3>Legal Compliance</h3>
        <p>Hosts must comply with all local laws and regulations, including:</p>
        <ul>
          <li>Zoning and licensing requirements</li>
          <li>Tax obligations</li>
          <li>Health and safety regulations</li>
        </ul>
        
        <h3>Reporting Issues</h3>
        <p>If you encounter any safety or compliance issues, please report them immediately through our platform.</p>
      `,
    },
  };

  const policy = policies[type] || policies.privacy;

  return (
    <div className="container-custom py-12">
      <h1 className="text-3xl font-display font-bold text-foreground mb-8">
        {policy.title}
      </h1>
      <div className="card prose max-w-none">
        <div dangerouslySetInnerHTML={{ __html: policy.content }} />
      </div>
    </div>
  );
}

export default Policy;

