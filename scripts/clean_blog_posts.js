const fs = require('fs');

// Clean blog posts from Mailchimp tracking URLs
const cleanBlogPosts = [
  {
    "id": 9,
    "title": "Howdy!",
    "content": "<p>Welcome to farewellcafe.com, home of Farewell - and Howdy (click the dangling \"HOWDY\" near the top right to switch views) - on the world wide web. Hope you have fun exploring the site, there's a lot going on!</p>",
    "created_at": "2025-06-16T16:03:10.433Z"
  },
  {
    "id": 13,
    "title": "KCMA - COMMUNITY GARDEN WORKDAY WEDNESDAYS",
    "content": "<p><img src=\"https://fwhy-bimg.farewellcafe.com/community_garden_poster.jpeg\"></p><p>Every Wednesday from 6 - 8 PM , Behind Farewell (6515 Stadium Dr.)</p>",
    "created_at": "2025-06-16T16:03:10.434Z"
  },
  {
    "id": 14,
    "title": "Now Open: Northeast Pizza",
    "content": "<p><img src=\"https://fwhy-bimg.farewellcafe.com/pizza_pizza.jpeg\"></p><p>2203 Lexington Ave., Kansas City, Missouri is now home to <strong>Northeast Pizza</strong>. The New York-style pizza joint is owned and operated by Max Popoff (Farewell Cafe), Noah Quillec (French Market), and Michael DeStefano (Verbena). Read about the origins of the shop <a href=\"https://www.kcur.org/arts-life/2025-01-26/pizza-kansas-city-historic-northeast-noah-quillec\" rel=\"noopener noreferrer\" target=\"_blank\"><strong>here</strong></a> in a new KCUR/Startland article and click <a href=\"https://www.northeastpizzakc.com/\" rel=\"noopener noreferrer\" target=\"_blank\"><strong>here</strong></a> to check out the menu, order online, and follow the shop on social media!</p><p><br></p>",
    "created_at": "2025-06-16T16:03:10.434Z"
  },
  {
    "id": 15,
    "title": "Farewell and Howdy t-shirts for sale!",
    "content": "<p><img src=\"https://fwhy-bimg.farewellcafe.com/tshirts_4sale.jpeg\"></p><p>Our white (top two images) and black (bottom right two images) Farewell pocket tees are available at the bar for $30 and our Howdy logo tees are available for $20. Just holler at the bartender during open hours to buy yours!</p>",
    "created_at": "2025-06-16T16:03:10.434Z"
  },
  {
    "id": 16,
    "title": "Have you visited Howdy DIY Thrift yet?",
    "content": "<p><img src=\"https://fwhy-bimg.farewellcafe.com/HOWDYTHRIFT.jpg\"></p><p>Come on down, meet Stanley, and browse a fun and affordable selection of clothing and accessories. Follow @<a href=\"https://www.instagram.com/howdydiythrift/\" rel=\"noopener noreferrer\" target=\"_blank\"><strong>HowdyDIYThrift</strong></a> on Instagram to stay updated on shop hours and new arrivals!</p>",
    "created_at": "2025-06-16T16:03:10.434Z"
  }
];

// Save cleaned posts
fs.writeFileSync('blog_posts_clean.json', JSON.stringify(cleanBlogPosts, null, 2));
console.log('✅ Cleaned blog posts saved to blog_posts_clean.json');
console.log('Removed Mailchimp tracking URLs from posts 14 and 16');
