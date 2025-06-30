import { Link } from 'react-router-dom';

export function BoltBadge() {
  return (
    <Link 
      to="https://bolt.new" 
      target="_blank" 
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 z-50 w-16 h-16 sm:w-20 sm:h-20 transition-transform hover:scale-110"
      aria-label="Built with Bolt.new"
    >
      <img 
        src="https://github.com/kickiniteasy/bolt-hackathon-badge/blob/main/src/public/bolt-badge/black_circle_360x360/black_circle_360x360.png?raw=true" 
        alt="Built with Bolt.new" 
        className="w-full h-full"
      />
    </Link>
  );
}