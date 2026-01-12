import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"

export function InventoryCard({ car }: { car: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{car.make} {car.model}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Año: {car.year}</p>
        <p className="text-lg font-bold">$ {car.price}</p>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Ver detalles</Button>
      </CardFooter>
    </Card>
  )
}
